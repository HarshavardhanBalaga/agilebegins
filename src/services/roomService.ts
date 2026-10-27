import "server-only";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import {
  COLLECTIONS,
  ROOM_BREAK_SECONDS,
  ROOM_FOCUS_SECONDS,
  ROOM_MESSAGES_LIMIT,
  ROOM_ONLINE_MS,
  ROOM_PRESENCE,
  ROOM_TASKS_MAX,
  ROOM_TIMER_PHASE,
  ROOM_TIMER_STATE,
  type RoomPresence,
  type RoomTimerPhase,
} from "@/lib/constants";
import { normalizeText, stripHtml } from "@/lib/sanitize";
import { AppError } from "@/lib/http";
import { studyRoomRepository } from "@/repositories/studyRoomRepository";
import { roomMessageRepository } from "@/repositories/roomMessageRepository";
import { roomTaskRepository } from "@/repositories/roomTaskRepository";
import { roomSafetyRepository } from "@/repositories/roomSafetyRepository";
import { userRepository } from "@/repositories/userRepository";
import type { UserDocument } from "@/models/user";
import type { RoomMemberState, RoomTimer, StudyRoomDocument } from "@/models/studyRoom";


/** One member as the client renders them (self + partner). */
export interface RoomMemberView {
  id: string;
  displayName: string;
  avatarUrl?: string;
  goal: string;
  presence: RoomPresence;
  online: boolean;
  lastSeenAt: string;
  self: boolean;
}

export interface RoomTimerView {
  phase: RoomTimerPhase;
  state: "stopped" | "running" | "paused";
  /** Seconds left right now (server-computed while running). */
  remainingSec: number;
  durationSec: number;
  updatedByName: string | null;
  updatedAt: string;
}

export interface RoomTaskView {
  id: string;
  text: string;
  completed: boolean;
  completedByName: string | null;
  createdByName: string;
  createdAt: string;
}

export interface RoomMessageView {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  self: boolean;
  createdAt: string;
}

export interface RoomSummaryView {
  durationMin: number;
  focusSec: number;
  tasksCompleted: number;
  messagesExchanged: number;
  closedAt: string;
  closedBySelf: boolean;
}

/** Everything one 3s poll returns. */
export interface RoomStateView {
  roomId: string;
  status: "active";
  createdAt: string;
  elapsedSec: number;
  members: RoomMemberView[];
  timer: RoomTimerView;
  tasks: RoomTaskView[];
  messages: RoomMessageView[];
}

export function notRoomMember(): AppError {
  return new AppError("Study room not found.", 404, undefined, "ROOM_NOT_FOUND");
}

export function memberKey(id: ObjectId): string {
  return id.toHexString();
}

export function defaultRoomMember(userId: ObjectId, now: Date): RoomMemberState {
  return {
    userId,
    goal: "",
    presence: ROOM_PRESENCE.STUDYING,
    presenceUpdatedAt: now,
    lastSeenAt: now,
  };
}

export function withRoomMembers(room: StudyRoomDocument): StudyRoomDocument {
  const members: Record<string, RoomMemberState> = { ...(room.members ?? {}) };
  for (const id of room.memberIds) {
    const key = memberKey(id);
    if (!members[key]) members[key] = defaultRoomMember(id, room.createdAt);
  }
  return { ...room, members };
}

export function displayNameOf(user: Pick<UserDocument, "displayName" | "name">): string {
  return user.displayName?.trim() || user.name;
}

export function cleanRoomText(value: string, max: number): string {
  return stripHtml(normalizeText(value)).slice(0, max);
}

/**
 * Server-side timer rollover: a running phase whose `endsAt` passed advances
 * automatically (focus → break → stopped), banking focus seconds. Runs on
 * every state read + every timer write so both partners converge without a
 * cron job.
 */
export function settleRoomTimer(
  room: StudyRoomDocument,
  now: Date
): { timer: RoomTimer; focusBankedSec: number; dirty: boolean } {
  const fallback: RoomTimer = {
    phase: ROOM_TIMER_PHASE.IDLE,
    state: ROOM_TIMER_STATE.STOPPED,
    durationSec: ROOM_FOCUS_SECONDS,
    remainingSec: ROOM_FOCUS_SECONDS,
    updatedAt: room.createdAt,
  };
  const timer: RoomTimer = { ...(room.timer ?? fallback) };
  if (timer.state !== ROOM_TIMER_STATE.RUNNING || !timer.endsAt) {
    return { timer, focusBankedSec: 0, dirty: false };
  }
  let focusBankedSec = 0;
  let dirty = false;
  for (let step = 0; step < 3; step++) {
    const endsAt = timer.endsAt ? new Date(timer.endsAt).getTime() : now.getTime();
    if (Number.isNaN(endsAt) || endsAt > now.getTime()) break;
    dirty = true;
    if (timer.phase === ROOM_TIMER_PHASE.FOCUS) {
      focusBankedSec += timer.durationSec;
      timer.phase = ROOM_TIMER_PHASE.BREAK;
      timer.state = ROOM_TIMER_STATE.RUNNING;
      timer.durationSec = ROOM_BREAK_SECONDS;
      timer.remainingSec = ROOM_BREAK_SECONDS;
      timer.endsAt = new Date(now.getTime() + ROOM_BREAK_SECONDS * 1000);
      timer.updatedAt = now;
    } else if (timer.phase === ROOM_TIMER_PHASE.BREAK) {
      timer.phase = ROOM_TIMER_PHASE.IDLE;
      timer.state = ROOM_TIMER_STATE.STOPPED;
      timer.durationSec = ROOM_FOCUS_SECONDS;
      timer.remainingSec = ROOM_FOCUS_SECONDS;
      delete timer.endsAt;
      timer.updatedAt = now;
      break;
    } else {
      timer.state = ROOM_TIMER_STATE.STOPPED;
      timer.remainingSec = timer.durationSec;
      delete timer.endsAt;
      timer.updatedAt = now;
      break;
    }
  }
  return { timer, focusBankedSec, dirty };
}

export function remainingForTimer(timer: RoomTimer, now: Date): number {
  if (timer.state === ROOM_TIMER_STATE.RUNNING && timer.endsAt) {
    const endsAt = new Date(timer.endsAt).getTime();
    if (!Number.isNaN(endsAt)) {
      return Math.max(0, Math.round((endsAt - now.getTime()) / 1000));
    }
  }
  return Math.max(0, timer.remainingSec);
}

export async function persistRoomTimer(
  roomId: ObjectId,
  timer: RoomTimer,
  focusBankedSec: number,
  now: Date
): Promise<void> {
  const db = await connectDB();
  await db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).updateOne(
    { _id: roomId },
    {
      $set: {
        timer: {
          ...timer,
          endsAt: timer.endsAt ? new Date(timer.endsAt) : undefined,
          updatedAt: now,
        },
        updatedAt: now,
        lastActivityAt: now,
      },
      ...(focusBankedSec > 0 ? { $inc: { focusBankedSec } } : {}),
    }
  );
}

function nameOfView(views: RoomMemberView[], idHex: string | undefined): string | null {
  if (!idHex) return null;
  return views.find((m) => m.id === idHex)?.displayName ?? null;
}

async function buildMemberViews(
  room: StudyRoomDocument,
  callerId: ObjectId,
  now: Date
): Promise<RoomMemberView[]> {
  const users = await Promise.all(room.memberIds.map((id) => userRepository.findById(id)));
  return room.memberIds.map((id, index) => {
    const user = users[index];
    const key = memberKey(id);
    const state = room.members?.[key] ?? defaultRoomMember(id, room.createdAt);
    const lastSeen = state.lastSeenAt ? new Date(state.lastSeenAt).getTime() : 0;
    return {
      id: key,
      displayName: user ? displayNameOf(user) : "Study partner",
      ...(user?.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      goal: state.goal,
      presence: state.presence,
      online: now.getTime() - lastSeen <= ROOM_ONLINE_MS,
      lastSeenAt: new Date(state.lastSeenAt).toISOString(),
      self: id.equals(callerId),
    };
  });
}

async function buildRoomView(
  room: StudyRoomDocument,
  callerId: ObjectId,
  now: Date
): Promise<RoomStateView> {
  const members = await buildMemberViews(room, callerId, now);
  const timer: RoomTimer = room.timer ?? {
    phase: ROOM_TIMER_PHASE.IDLE,
    state: ROOM_TIMER_STATE.STOPPED,
    durationSec: ROOM_FOCUS_SECONDS,
    remainingSec: ROOM_FOCUS_SECONDS,
    updatedAt: room.createdAt,
  };
  const [tasks, messages] = await Promise.all([
    roomTaskRepository.listByRoom(room._id),
    roomMessageRepository.listLatest(room._id, ROOM_MESSAGES_LIMIT),
  ]);
  const taskViews = await Promise.all(
    tasks.map(async (task) => {
      const creator = await userRepository.findById(task.createdBy);
      const completer = task.completedBy ? await userRepository.findById(task.completedBy) : null;
      const createdByName = creator ? displayNameOf(creator) : "Someone";
      const completedByName = completer ? displayNameOf(completer) : task.completed ? "Someone" : null;
      return {
        id: task._id.toHexString(),
        text: task.text,
        completed: task.completed,
        completedByName,
        createdByName,
        createdAt: task.createdAt.toISOString(),
      };
    })
  );
  const messageViews = await Promise.all(
    messages.map(async (message) => {
      const sender = members.find((m) => m.id === message.senderId.toHexString());
      let senderName = sender?.displayName ?? "Someone";
      if (!sender) {
        const user = await userRepository.findById(message.senderId);
        if (user) senderName = displayNameOf(user);
      }
      return {
        id: message._id.toHexString(),
        text: message.text,
        senderId: message.senderId.toHexString(),
        senderName,
        self: message.senderId.equals(callerId),
        createdAt: message.createdAt.toISOString(),
      };
    })
  );
  return {
    roomId: room._id.toHexString(),
    status: "active",
    createdAt: room.createdAt.toISOString(),
    elapsedSec: Math.max(0, Math.floor((now.getTime() - new Date(room.createdAt).getTime()) / 1000)),
    members,
    timer: {
      phase: timer.phase,
      state: timer.state,
      remainingSec: remainingForTimer(timer, now),
      durationSec: timer.durationSec,
      updatedByName: nameOfView(members, timer.updatedBy?.toHexString()),
      updatedAt: new Date(timer.updatedAt).toISOString(),
    },
    tasks: taskViews,
    messages: messageViews,
  };
}

/** Completion stats written once on close (leave + block paths). */
export async function buildRoomSummary(
  roomId: ObjectId,
  closedBy: ObjectId,
  now = new Date()
): Promise<NonNullable<StudyRoomDocument["summary"]>> {
  const db = await connectDB();
  const room = await db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).findOne({ _id: roomId });
  if (!room) throw notRoomMember();
  const settled = settleRoomTimer(withRoomMembers(room), now);
  if (settled.dirty) await persistRoomTimer(roomId, settled.timer, settled.focusBankedSec, now);
  const banked =
    ((room as StudyRoomDocument & { focusBankedSec?: number }).focusBankedSec ?? 0) +
    settled.focusBankedSec;
  const elapsedSec = Math.max(0, Math.floor((now.getTime() - new Date(room.createdAt).getTime()) / 1000));
  const [tasksCompleted, messagesExchanged] = await Promise.all([
    roomTaskRepository.countCompletedByRoom(roomId),
    roomMessageRepository.countByRoom(roomId),
  ]);
  return {
    durationMin: Math.max(1, Math.round(elapsedSec / 60)),
    focusSec: Math.max(0, Math.min(elapsedSec, banked)),
    tasksCompleted,
    messagesExchanged,
    closedBy,
    closedAt: now,
  };
}

/**
 * Business logic for the co-study room MVP. Membership is always
 * re-verified, every write touches only the caller's active room, and all
 * reads settle the shared timer first.
 */
export const roomService = {
  /** Full room snapshot for one poll tick (also records the heartbeat). */
  async state(user: UserDocument, roomId: ObjectId, now = new Date()): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const withState = withRoomMembers(room);
    const settled = settleRoomTimer(withState, now);
    const key = memberKey(user._id);
    const me = withState.members?.[key] ?? defaultRoomMember(user._id, now);
    const db = await connectDB();
    const timerUpdate = settled.dirty
      ? {
          timer: {
            ...settled.timer,
            endsAt: settled.timer.endsAt ? new Date(settled.timer.endsAt) : undefined,
            updatedAt: now,
          },
        }
      : {};
    await db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).updateOne(
      { _id: roomId },
      {
        $set: {
          [`members.${key}`]: { ...me, lastSeenAt: now },
          ...timerUpdate,
          updatedAt: now,
          lastActivityAt: now,
        },
        ...(settled.focusBankedSec > 0 ? { $inc: { focusBankedSec: settled.focusBankedSec } } : {}),
      }
    );
    const fresh: StudyRoomDocument = {
      ...withState,
      timer: settled.timer,
      members: { ...(withState.members ?? {}), [key]: { ...me, lastSeenAt: now } },
    };
    return buildRoomView(fresh, user._id, now);
  },

  /** Lightweight session goal (empty string clears it). */
  async setGoal(user: UserDocument, roomId: ObjectId, goal: string, now = new Date()): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const clean = cleanRoomText(goal, 140);
    const withState = withRoomMembers(room);
    const key = memberKey(user._id);
    const me = withState.members?.[key] ?? defaultRoomMember(user._id, now);
    const db = await connectDB();
    await db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).updateOne(
      { _id: roomId },
      {
        $set: {
          [`members.${key}`]: { ...me, goal: clean, goalUpdatedAt: now, lastSeenAt: now },
          updatedAt: now,
          lastActivityAt: now,
        },
      }
    );
    return roomService.state(user, roomId, now);
  },

  /** Presence control: studying / break / away. */
  async setPresence(
    user: UserDocument,
    roomId: ObjectId,
    presence: RoomPresence,
    now = new Date()
  ): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const withState = withRoomMembers(room);
    const key = memberKey(user._id);
    const me = withState.members?.[key] ?? defaultRoomMember(user._id, now);
    const db = await connectDB();
    await db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).updateOne(
      { _id: roomId },
      {
        $set: {
          [`members.${key}`]: { ...me, presence, presenceUpdatedAt: now, lastSeenAt: now },
          updatedAt: now,
          lastActivityAt: now,
        },
      }
    );
    return roomService.state(user, roomId, now);
  },

  /**
   * Shared timer. `start` begins a focus or break phase (focus uses the shared
   * idle length, 25:00 by default); `set` changes that idle length while the
   * timer is stopped; `pause` freezes the countdown; `resume` continues it;
   * `finish` banks a partial focus phase and returns to idle. Either member
   * may drive it — last write wins, both see the same server clock.
   */
  async timer(
    user: UserDocument,
    roomId: ObjectId,
    action: "start" | "pause" | "resume" | "finish" | "set",
    phase: RoomTimerPhase = ROOM_TIMER_PHASE.FOCUS,
    durationSec?: number,
    now = new Date()
  ): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const withState = withRoomMembers(room);
    const settled = settleRoomTimer(withState, now);
    const timer = settled.timer;
    let focusBankedSec = settled.focusBankedSec;

    if (action === "set") {
      if (timer.state !== ROOM_TIMER_STATE.STOPPED) {
        throw new AppError("Timer is already running.", 409, undefined, "TIMER_NOT_STOPPED");
      }
      timer.durationSec = durationSec ?? ROOM_FOCUS_SECONDS;
      timer.remainingSec = timer.durationSec;
      timer.updatedBy = user._id;
      timer.updatedAt = now;
    } else if (action === "start") {
      const length =
        durationSec ?? (phase === ROOM_TIMER_PHASE.BREAK ? ROOM_BREAK_SECONDS : timer.durationSec);
      timer.phase = phase;
      timer.state = ROOM_TIMER_STATE.RUNNING;
      timer.durationSec = length;
      timer.remainingSec = length;
      timer.endsAt = new Date(now.getTime() + length * 1000);
      timer.updatedBy = user._id;
      timer.updatedAt = now;
    } else if (action === "pause") {
      if (timer.state !== ROOM_TIMER_STATE.RUNNING) {
        throw new AppError("Timer is not running.", 409, undefined, "TIMER_NOT_RUNNING");
      }
      if (timer.phase === ROOM_TIMER_PHASE.FOCUS) {
        focusBankedSec += Math.max(0, timer.durationSec - remainingForTimer(timer, now));
      }
      timer.remainingSec = remainingForTimer(timer, now);
      timer.state = ROOM_TIMER_STATE.PAUSED;
      delete timer.endsAt;
      timer.updatedBy = user._id;
      timer.updatedAt = now;
    } else if (action === "resume") {
      if (timer.state !== ROOM_TIMER_STATE.PAUSED) {
        throw new AppError("Timer is not paused.", 409, undefined, "TIMER_NOT_PAUSED");
      }
      timer.state = ROOM_TIMER_STATE.RUNNING;
      timer.endsAt = new Date(now.getTime() + timer.remainingSec * 1000);
      timer.updatedBy = user._id;
      timer.updatedAt = now;
    } else {
      if (timer.phase === ROOM_TIMER_PHASE.FOCUS && timer.state !== ROOM_TIMER_STATE.STOPPED) {
        const remaining = timer.state === ROOM_TIMER_STATE.RUNNING ? remainingForTimer(timer, now) : timer.remainingSec;
        focusBankedSec += Math.max(0, timer.durationSec - remaining);
      }
      timer.phase = ROOM_TIMER_PHASE.IDLE;
      timer.state = ROOM_TIMER_STATE.STOPPED;
      timer.durationSec = ROOM_FOCUS_SECONDS;
      timer.remainingSec = ROOM_FOCUS_SECONDS;
      delete timer.endsAt;
      timer.updatedBy = user._id;
      timer.updatedAt = now;
    }

    await persistRoomTimer(roomId, timer, focusBankedSec, now);
    return roomService.state(user, roomId, now);
  },

  /** Adds one shared task (20 open-task MVP cap). */
  async addTask(user: UserDocument, roomId: ObjectId, text: string, now = new Date()): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const clean = cleanRoomText(text, 120);
    if (!clean) {
      throw new AppError("Task text is required.", 400, undefined, "TASK_EMPTY");
    }
    const open = await roomTaskRepository.countOpenByRoom(roomId);
    if (open >= ROOM_TASKS_MAX) {
      throw new AppError("Task list is full (20 open tasks max).", 409, undefined, "TASKS_FULL");
    }
    await roomTaskRepository.insert({
      _id: new ObjectId(),
      roomId,
      text: clean,
      completed: false,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    await studyRoomRepository.touchActivity(roomId, now);
    return roomService.state(user, roomId, now);
  },

  /** Toggles one shared task. */
  async toggleTask(
    user: UserDocument,
    roomId: ObjectId,
    taskId: ObjectId,
    completed: boolean,
    now = new Date()
  ): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const updated = await roomTaskRepository.setCompleted(taskId, roomId, completed, user._id, now);
    if (!updated) {
      throw new AppError("Task not found.", 404, undefined, "TASK_NOT_FOUND");
    }
    await studyRoomRepository.touchActivity(roomId, now);
    return roomService.state(user, roomId, now);
  },

  /** Posts one chat message. */
  async sendMessage(user: UserDocument, roomId: ObjectId, text: string, now = new Date()): Promise<RoomStateView> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const clean = cleanRoomText(text, 500);
    if (!clean) {
      throw new AppError("Message text is required.", 400, undefined, "MESSAGE_EMPTY");
    }
    await roomMessageRepository.insert({
      _id: new ObjectId(),
      roomId,
      senderId: user._id,
      text: clean,
      createdAt: now,
    });
    await studyRoomRepository.touchActivity(roomId, now);
    return roomService.state(user, roomId, now);
  },

  /** Files a safety report against the partner (stored for later review). */
  async report(
    user: UserDocument,
    roomId: ObjectId,
    reason: string,
    now = new Date()
  ): Promise<{ reported: boolean }> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const partnerId = room.memberIds.find((id) => !id.equals(user._id));
    if (!partnerId) throw notRoomMember();
    const clean = cleanRoomText(reason, 500);
    await roomSafetyRepository.insertReport({
      _id: new ObjectId(),
      roomId,
      reporterId: user._id,
      reportedId: partnerId,
      reason: clean,
      createdAt: now,
    });
    return { reported: true };
  },

  /** Blocks the partner and leaves the room; the pair never matches again. */
  async block(
    user: UserDocument,
    roomId: ObjectId,
    now = new Date()
  ): Promise<{ roomId: string }> {
    const room = await studyRoomRepository.findActiveByIdForMember(roomId, user._id);
    if (!room) throw notRoomMember();
    const partnerId = room.memberIds.find((id) => !id.equals(user._id));
    if (!partnerId) throw notRoomMember();
    await roomSafetyRepository.upsertBlock({
      _id: new ObjectId(),
      roomId,
      blockerId: user._id,
      blockedId: partnerId,
      createdAt: now,
    });
    const summary = await buildRoomSummary(roomId, user._id, now);
    await studyRoomRepository.closeWithSummary(roomId, user._id, summary, now);
    return { roomId: roomId.toHexString() };
  },

  /** Closed-room summary for the completion screen (own rooms only). */
  async summary(user: UserDocument, roomId: ObjectId): Promise<RoomSummaryView> {
    const closed = await studyRoomRepository.findClosedByIdForMember(roomId, user._id);
    if (!closed?.summary) {
      throw new AppError("Session summary not found.", 404, undefined, "SUMMARY_NOT_FOUND");
    }
    return {
      durationMin: closed.summary.durationMin,
      focusSec: closed.summary.focusSec,
      tasksCompleted: closed.summary.tasksCompleted,
      messagesExchanged: closed.summary.messagesExchanged,
      closedAt: new Date(closed.summary.closedAt).toISOString(),
      closedBySelf: closed.summary.closedBy
        ? new ObjectId(closed.summary.closedBy).equals(user._id)
        : false,
    };
  },
};

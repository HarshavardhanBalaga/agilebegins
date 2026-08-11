import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS, PAYMENT_STATUS } from "@/lib/constants";
import type { PaymentStatus } from "@/lib/constants";
import type {
  RegistrationDocument,
  NewRegistration,
  RegistrationView,
  RegistrationDetail,
} from "@/models/registration";
import { ObjectId, type Filter } from "mongodb";
import { escapeRegex } from "@/lib/sanitize";

const REGISTRATIONS = COLLECTIONS.REGISTRATIONS;

const SEARCH_FIELDS = [
  "name",
  "email",
  "phone",
  "college",
  "branch",
  "year",
  "transactionId",
] as const;

/** A registration doc joined with its workshop title and user record. */
type JoinedRegistration = RegistrationDocument & {
  workshop: { title: string }[];
  user: { emailVerified?: boolean }[];
};

/** Serializes a joined registration doc into the admin-facing view shape. */
function toView(doc: JoinedRegistration): RegistrationView {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    workshopId: doc.workshopId.toString(),
    workshopTitle: doc.workshop[0]?.title ?? "Unknown",
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    college: doc.college,
    branch: doc.branch,
    year: doc.year,
    transactionId: doc.transactionId,
    paymentStatus: doc.paymentStatus,
    // Same rule as isEmailVerified: legacy accounts without the field are verified.
    emailVerified: doc.user[0]?.emailVerified !== false,
    confirmationMailSent: doc.confirmationMailSent,
    meetingLinkSent: doc.meetingLinkSent,
    attendance: doc.attendance,
    createdAt: doc.createdAt.toISOString(),
    hasScreenshot: Boolean(doc.screenshot),
  };
}

/**
 * Case-insensitive OR query over the searchable registration fields. Returns
 * null for blank input so callers can skip the `$or` clause entirely.
 */
function buildSearchFilter(
  search: string | undefined
): Filter<RegistrationDocument>["$or"] | null {
  const term = search?.trim();
  if (!term) return null;
  const pattern = { $regex: escapeRegex(term), $options: "i" };
  return SEARCH_FIELDS.map((field) => ({ [field]: pattern }));
}

/**
 * Data access for the `registrations` collection. Aggregation joins against
 * `workshops` only for the admin views; writes stay simple and atomic.
 */
export const registrationRepository = {
  async create(registration: NewRegistration): Promise<RegistrationDocument> {
    const db = await connectDB();
    const _id = new ObjectId();
    const now = new Date();
    await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .insertOne({ _id, ...registration, createdAt: now, updatedAt: now });
    return {
      _id,
      ...registration,
      createdAt: now,
      updatedAt: now,
    };
  },

  async findByUserAndWorkshop(
    userId: ObjectId,
    workshopId: ObjectId
  ): Promise<RegistrationDocument | null> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .findOne({ userId, workshopId });
  },

  /**
   * Returns the user's registration for a workshop when it is still active
   * (pending or verified). Rejected rows are excluded so a rejected student
   * may re-register from scratch.
   */
  async findActiveByUserAndWorkshop(
    userId: ObjectId,
    workshopId: ObjectId
  ): Promise<RegistrationDocument | null> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .findOne({
        userId,
        workshopId,
        paymentStatus: { $ne: PAYMENT_STATUS.REJECTED },
      });
  },

  /**
   * Re-activates a rejected registration with freshly submitted details and a
   * new pending status. The row is reused rather than re-inserted to respect
   * the unique (userId + workshopId) index; createdAt is bumped so the
   * re-submission surfaces at the top of the admin pending list.
   */
  async resetRejected(
    id: ObjectId,
    data: Pick<
      NewRegistration,
      | "name"
      | "email"
      | "phone"
      | "college"
      | "branch"
      | "year"
      | "transactionId"
      | "screenshot"
    >
  ): Promise<RegistrationDocument> {
    const db = await connectDB();
    const now = new Date();
    await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .updateOne(
        { _id: id, paymentStatus: PAYMENT_STATUS.REJECTED },
        {
          $set: {
            ...data,
            paymentStatus: PAYMENT_STATUS.PENDING,
            confirmationMailSent: false,
            meetingLinkSent: false,
            createdAt: now,
            updatedAt: now,
          },
        }
      );
    return (await this.findById(id)) as RegistrationDocument;
  },

  async findByTransactionId(
    transactionId: string
  ): Promise<RegistrationDocument | null> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .findOne({ transactionId });
  },

  async findById(id: ObjectId): Promise<RegistrationDocument | null> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .findOne({ _id: id });
  },

  /**
   * Full admin detail for one registration: the list view fields plus the
   * payment screenshot and last-update timestamp.
   */
  async findViewDetail(
    id: ObjectId
  ): Promise<RegistrationDetail | null> {
    const db = await connectDB();
    const doc = await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .aggregate<JoinedRegistration>([
        { $match: { _id: id } },
        {
          $lookup: {
            from: COLLECTIONS.WORKSHOPS,
            localField: "workshopId",
            foreignField: "_id",
            as: "workshop",
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
      ])
      .next();

    if (!doc) return null;
    return {
      ...toView(doc),
      screenshot: doc.screenshot ?? null,
      updatedAt: doc.updatedAt.toISOString(),
    };
  },

  async findByIds(ids: ObjectId[]): Promise<RegistrationDocument[]> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .find({ _id: { $in: ids } })
      .toArray();
  },

  async updateStatus(
    id: ObjectId,
    paymentStatus: PaymentStatus
  ): Promise<void> {
    const db = await connectDB();
    await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .updateOne(
        { _id: id },
        { $set: { paymentStatus, updatedAt: new Date() } }
      );
  },

  async updateEmailFlags(id: ObjectId, flags: {
    confirmationMailSent?: boolean;
    meetingLinkSent?: boolean;
  }): Promise<void> {
    const db = await connectDB();
    await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .updateOne(
        { _id: id },
        { $set: { ...flags, updatedAt: new Date() } }
      );
  },

  async toggleAttendance(id: ObjectId, attendance: boolean): Promise<void> {
    const db = await connectDB();
    await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .updateOne({ _id: id }, { $set: { attendance, updatedAt: new Date() } });
  },

  /**
   * Admin list with the workshop title joined in. Returns paged views plus
   * the current status counts so the dashboard renders from one query.
   *
   * Filters:
   * - `workshopId` restricts rows to one workshop.
   * - `status` restricts the paged rows (and `total`) to one status.
   * - `search` matches name/email/phone/college/branch/year/transaction id.
   *
   * `counts` always ignores `status` so the status tabs show how many rows
   * are available for each status within the current workshop/search scope.
   */
  async listViews(input: {
    page: number;
    pageSize: number;
    workshopId?: ObjectId;
    status?: PaymentStatus;
    search?: string;
  }): Promise<{
    items: RegistrationView[];
    total: number;
    counts: Record<PaymentStatus, number>;
  }> {
    const db = await connectDB();
    const collection = db.collection<RegistrationDocument>(REGISTRATIONS);
    const skip = Math.max(0, (input.page - 1) * input.pageSize);

    const scope: Filter<RegistrationDocument> = {};
    if (input.workshopId) scope.workshopId = input.workshopId;

    const searchFilter = buildSearchFilter(input.search);
    const listFilter: Filter<RegistrationDocument> = {
      ...scope,
      ...(input.status ? { paymentStatus: input.status } : {}),
      ...(searchFilter ? { $or: searchFilter } : {}),
    };
    const countFilter: Filter<RegistrationDocument> = {
      ...scope,
      ...(searchFilter ? { $or: searchFilter } : {}),
    };

    const [total, counts, docs] = await Promise.all([
      collection.countDocuments(listFilter),
      this.countByStatus(countFilter),
      collection
        .aggregate<JoinedRegistration>([
          { $match: listFilter },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: input.pageSize },
          {
            $lookup: {
              from: COLLECTIONS.WORKSHOPS,
              localField: "workshopId",
              foreignField: "_id",
              as: "workshop",
            },
          },
          {
            $lookup: {
              from: COLLECTIONS.USERS,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
        ])
        .toArray(),
    ]);

    return {
      items: docs.map(toView),
      total,
      counts,
    };
  },

  /**
   * Status breakdown for a filter scope. Pass an empty filter for the global
   * totals, or `{ workshopId }` / a search scope to narrow it.
   */
  async countByStatus(
    match: Filter<RegistrationDocument> = {}
  ): Promise<Record<PaymentStatus, number>> {
    const db = await connectDB();
    const results = await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .aggregate<{ _id: PaymentStatus; count: number }>([
        { $match: match },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      ])
      .toArray();

    return {
      pending: 0,
      verified: 0,
      rejected: 0,
      ...Object.fromEntries(results.map((r) => [r._id, r.count])),
    };
  },

  /**
   * Per-workshop registration breakdown for the admin tab bar. Workshops with
   * no registrations are not included — the tab bar derives those from the
   * workshops collection and shows a zero total.
   */
  async countByWorkshop(): Promise<
    Array<{
      workshopId: ObjectId;
      total: number;
      pending: number;
      verified: number;
      rejected: number;
      attended: number;
    }>
  > {
    const db = await connectDB();
    const results = await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .aggregate<{
        _id: ObjectId;
        total: number;
        pending: number;
        verified: number;
        rejected: number;
        attended: number;
      }>([
        {
          $group: {
            _id: "$workshopId",
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
            },
            verified: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "verified"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "rejected"] }, 1, 0] },
            },
            attended: { $sum: { $cond: ["$attendance", 1, 0] } },
          },
        },
      ])
      .toArray();

    return results.map((r) => ({
      workshopId: r._id,
      total: r.total,
      pending: r.pending,
      verified: r.verified,
      rejected: r.rejected,
      attended: r.attended,
    }));
  },

  async findByUser(userId: ObjectId): Promise<RegistrationDocument[]> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  },
};
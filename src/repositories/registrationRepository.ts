import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { PaymentStatus } from "@/lib/constants";
import type {
  RegistrationDocument,
  NewRegistration,
  RegistrationView,
} from "@/models/registration";
import { ObjectId } from "mongodb";

const REGISTRATIONS = COLLECTIONS.REGISTRATIONS;

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
   */
  async listViews(input: {
    page: number;
    pageSize: number;
  }): Promise<{
    items: RegistrationView[];
    total: number;
    counts: Record<PaymentStatus, number>;
  }> {
    const db = await connectDB();
    const collection = db.collection<RegistrationDocument>(REGISTRATIONS);
    const skip = Math.max(0, (input.page - 1) * input.pageSize);

    const [total, counts, docs] = await Promise.all([
      collection.countDocuments(),
      this.countByStatus(),
      collection
        .aggregate<RegistrationDocument & { workshop: { title: string }[] }>([
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
        ])
        .toArray(),
    ]);

    const items: RegistrationView[] = docs.map((doc) => ({
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
      confirmationMailSent: doc.confirmationMailSent,
      meetingLinkSent: doc.meetingLinkSent,
      attendance: doc.attendance,
      createdAt: doc.createdAt.toISOString(),
      hasScreenshot: Boolean(doc.screenshot),
    }));

    return { items, total, counts };
  },

  async countByStatus(): Promise<Record<PaymentStatus, number>> {
    const db = await connectDB();
    const results = await db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .aggregate<{ _id: PaymentStatus; count: number }>([
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

  async findByUser(userId: ObjectId): Promise<RegistrationDocument[]> {
    const db = await connectDB();
    return db
      .collection<RegistrationDocument>(REGISTRATIONS)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  },
};
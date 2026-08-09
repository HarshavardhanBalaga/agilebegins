import { httpError } from "@/lib/http";
import { PAYMENT_STATUS } from "@/lib/constants";
import { toObjectId } from "@/utils/ids";
import { workshopRepository } from "@/repositories/workshopRepository";
import { registrationRepository } from "@/repositories/registrationRepository";
import { emailService } from "@/services/emailService";
import type { RegistrationDocument } from "@/models/registration";
import type { UserDocument } from "@/models/user";
import type { WorkshopDocument } from "@/types/workshop";

export interface CreateRegistrationInput {
  workshopId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  transactionId: string;
  screenshot: string | null;
}

export interface DispatchResult {
  confirmationEmailSent: boolean;
}

/**
 * All business rules for workshop registrations live here. Repositories own
 * the database access, the email service owns sending, routes only wire it
 * together.
 */
export const registrationService = {
  async create(
    user: UserDocument,
    input: CreateRegistrationInput
  ): Promise<RegistrationDocument> {
    const workshop = await workshopRepository.findById(
      toObjectId(input.workshopId)
    );
    if (!workshop) {
      throw httpError.badRequest("Workshop not found.");
    }

    const alreadyRegistered = await registrationRepository.findByUserAndWorkshop(
      user._id,
      workshop._id
    );
    if (alreadyRegistered) {
      throw httpError.conflict(
        "You have already registered for this workshop."
      );
    }

    const duplicateTxn = await registrationRepository.findByTransactionId(
      input.transactionId
    );
    if (duplicateTxn) {
      throw httpError.conflict("This transaction id has already been used.");
    }

    return registrationRepository.create({
      userId: user._id,
      workshopId: workshop._id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      college: input.college,
      branch: input.branch,
      year: input.year,
      transactionId: input.transactionId,
      screenshot: input.screenshot,
      paymentStatus: PAYMENT_STATUS.PENDING,
      confirmationMailSent: false,
      meetingLinkSent: false,
      attendance: false,
    });
  },

  async listForAdmin(page: number, pageSize: number) {
    return registrationRepository.listViews({ page, pageSize });
  },

  async verifyPayment(id: string): Promise<DispatchResult> {
    const registration = await this.requirePending(id);
    const workshop = await this.requireWorkshop(registration);

    await registrationRepository.updateStatus(
      registration._id,
      PAYMENT_STATUS.VERIFIED
    );

    const dispatched = await this.dispatchConfirmation(
      registration,
      workshop
    );
    return dispatched;
  },

  async rejectPayment(id: string): Promise<void> {
    const registration = await this.requirePending(id);
    await registrationRepository.updateStatus(
      registration._id,
      PAYMENT_STATUS.REJECTED
    );
  },

  async resendConfirmation(id: string): Promise<DispatchResult> {
    const registration = await registrationRepository.findById(toObjectId(id));
    if (!registration) {
      throw httpError.notFound("Registration not found.");
    }
    const workshop = await this.requireWorkshop(registration);
    return this.dispatchConfirmation(registration, workshop);
  },

  async setAttendance(id: string, attendance: boolean): Promise<void> {
    const registration = await registrationRepository.findById(toObjectId(id));
    if (!registration) {
      throw httpError.notFound("Registration not found.");
    }
    await registrationRepository.toggleAttendance(registration._id, attendance);
  },

  /** Flat list of registrations for CSV export (max 10k rows). */
  async exportAll() {
    const { items } = await registrationRepository.listViews({
      page: 1,
      pageSize: 10_000,
    });
    return items;
  },

  async byId(id: string): Promise<RegistrationDocument> {
    const registration = await registrationRepository.findById(toObjectId(id));
    if (!registration) {
      throw httpError.notFound("Registration not found.");
    }
    return registration;
  },

  async loadPending(id: string): Promise<RegistrationDocument> {
    return this.requirePending(id);
  },

  /** Only a pending registration may be verified or rejected. */
  async requirePending(id: string): Promise<RegistrationDocument> {
    const registration = await registrationRepository.findById(toObjectId(id));
    if (!registration) {
      throw httpError.notFound("Registration not found.");
    }
    if (registration.paymentStatus !== PAYMENT_STATUS.PENDING) {
      throw httpError.conflict(
        "This registration has already been processed."
      );
    }
    return registration;
  },

  requireWorkshop(
    registration: RegistrationDocument
  ): Promise<WorkshopDocument> {
    return workshopRepository.findById(registration.workshopId).then((w) => {
      if (!w) throw httpError.badRequest("Workshop no longer exists.");
      return w;
    });
  },

  /**
   * Sends the confirmation email and marks the mail/meeting flags. Email is
   * best-effort: a failure keeps the registration verified but lets the
   * admin retry with "Send Confirmation Email".
   */
  async dispatchConfirmation(
    registration: RegistrationDocument,
    workshop: WorkshopDocument
  ): Promise<DispatchResult> {
    try {
      await emailService.sendConfirmationEmail({
        email: registration.email,
        name: registration.name,
        workshop,
      });
      await registrationRepository.updateEmailFlags(registration._id, {
        confirmationMailSent: true,
        meetingLinkSent: true,
      });
      return { confirmationEmailSent: true };
    } catch (error) {
      console.error("Confirmation email failed:", error);
      return { confirmationEmailSent: false };
    }
  },
};
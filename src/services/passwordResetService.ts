import { randomInt } from "node:crypto";
import { createHash } from "node:crypto";
import { httpError } from "@/lib/http";
import { OTP, TOKEN_PURPOSE } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import { userRepository } from "@/repositories/userRepository";
import { otpRepository } from "@/repositories/otpRepository";
import { emailService } from "@/services/emailService";

/**
 * Password reset via a 4-digit one-time password.
 *
 * The response to "forgot password" is deliberately generic so the endpoint
 * cannot be used to enumerate which emails have accounts — both a valid and
 * an unknown email receive the same "if the account exists, check your
 * inbox" message.
 */
export const passwordResetService = {
  /**
   * Generates a 4-digit code, stores only its sha-256 hash, and emails it.
   * Throws on SMTP failure so the user can retry, but never reveals whether
   * the email is registered.
   */
  async requestOtp(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Pretend success; nothing is sent and nothing is stored.
      return;
    }

    const code = generateOtp();
    await otpRepository.create({
      userId: user._id,
      purpose: TOKEN_PURPOSE.PASSWORD_RESET,
      codeHash: hashOtp(code),
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP.TTL_MS),
    });

    await emailService.sendOtpEmail({
      email: user.email,
      name: user.name,
      code,
    });
  },

  /**
   * Validates the code and resets the password. A wrong code increments the
   * attempt counter; reaching the limit invalidates the OTP entirely. A
   * successful reset clears all outstanding OTPs for the user.
   */
  async resetPassword(input: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    const invalid = httpError.badRequest(
      "The code is invalid or has expired. Please request a new one."
    );

    const user = await userRepository.findByEmail(input.email);
    if (!user) throw invalid;

    const otp = await otpRepository.findActive(
      user._id,
      TOKEN_PURPOSE.PASSWORD_RESET
    );
    if (!otp) throw invalid;

    if (hashOtp(input.code.trim()) !== otp.codeHash) {
      await otpRepository.incrementAttempts(otp._id);
      throw invalid;
    }

    await userRepository.updateCredentials(user._id, {
      password: await hashPassword(input.newPassword),
    });
    await otpRepository.invalidateAll(user._id, TOKEN_PURPOSE.PASSWORD_RESET);
  },
};

function generateOtp(): string {
  return String(randomInt(0, 10_000)).padStart(OTP.LENGTH, "0");
}

function hashOtp(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

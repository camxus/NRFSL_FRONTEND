import { api } from "./client";

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  avatar?: S3Location | string;
  kyc: {
    bvn: number,
    nin: number,
    identity: string,
    passport: string,
    utility: string,
    signature: string,
    religion: string,
    country: string,
    altEmail: string,
    altPhone: string,
    currentAddress: string,
    occupation: string,
    motherMaidenName: string,
    residentState: string,
    residentLGA: string,
    residentOtherLGA: string,
  }
  expo?: {
    push_token: string
  }
  created_at: string;
  updated_at?: string;
}

export interface S3Location {
  bucket: string;
  key: string;
  url: string;
}

type KycWithoutFiles = Omit<
  User["kyc"],
  "passport" | "identity" | "utility" | "signature" | "identity"
>;

type PartialUserWithoutFiles = Omit<Partial<User>, "kyc"> & {
  kyc?: KycWithoutFiles;
};

export interface SignupRequest extends Partial<PartialUserWithoutFiles> {
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  phone_number?: string;
  avatar_file?: File;
  avatar?: S3Location;
  passport?: File | null;
  identity?: File | null;
  utility?: File | null;
  signature?: File | null;
}

export interface SignupResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  token: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  };
  user: User;
}

export type RefreshTokenResponse = LoginResponse["token"];

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface SetNewPasswordRequest {
  email: string;
  newPassword: string;
}

export interface BVNValidateInput {
  bvn_token: string;
}

export interface BVNVerifyInput {
  bvn_token: string;
  verify_token: string;
}

// Auth API functions
export const authApi = {
  /**
   * Register a new user
   */
  signup: (data: SignupRequest & {providus_token: string | null}): Promise<SignupResponse> => {
    const formData = new FormData();

    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("first_name", data.first_name);
    formData.append("last_name", data.last_name);
    formData.append("birthdate", data.birthdate);
    if (data.kyc) formData.append("kyc", JSON.stringify(data.kyc));

    if (data.avatar) formData.append("avatar", JSON.stringify(data.avatar));
    if (data.avatar_file) formData.append("avatar_file", data.avatar_file);

    if (data.passport) formData.append("passport", data.passport);
    if (data.identity) formData.append("identity", data.identity);
    if (data.utility) formData.append("utility", data.utility);
    if (data.signature) formData.append("signature", data.signature);

    return api.post("/auth/signup", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Login a user
   */
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return api.post("/auth/login", data);
  },

  /**
   * Logout the current user
   */
  logout: (): Promise<void> => {
    return api.post("/auth/logout");
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return api.post("/auth/refresh-token", data);
  },

  /**
   * Initiate forgot password flow - sends reset code/email
   */
  forgotPassword: (data: ForgotPasswordRequest): Promise<void> => {
    return api.post("/auth/forgot-password", data);
  },

  /**
   * Confirm password reset with code
   */
  confirmPassword: (data: ConfirmPasswordRequest): Promise<void> => {
    return api.post("/auth/confirm-password", data);
  },

  /**
   * Set new password after confirmation
   */
  setNewPassword: (data: SetNewPasswordRequest): Promise<void> => {
    return api.post("/auth/set-new-password", data);
  },

  validateBVN: (data: BVNValidateInput) => {
    return api.post("/auth/validate-bvn", data);
  },

  verifyBVNToken: (data: BVNVerifyInput) => {
    return api.post("/auth/verify-bvn", data);
  }
};

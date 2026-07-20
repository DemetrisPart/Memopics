export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface MagicLinkSender {
  sendMagicLink(email: string, verifyUrl: string): Promise<void>;
}

export interface TokenHasher {
  hash(token: string): string;
}

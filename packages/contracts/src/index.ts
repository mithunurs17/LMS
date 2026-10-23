import { z } from 'zod';

export type EntityId = string;
export type IsoDateTime = string;

export const EntityIdSchema = z.string().trim().min(1);
export const IsoDateTimeSchema = z.string().datetime();
export const UserRoleSchema = z.enum(['learner', 'instructor', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export interface UserIdentity {
  id: EntityId;
  email: string;
  displayName: string;
  roles: UserRole[];
}

export const UserIdentitySchema = z.object({
  id: EntityIdSchema,
  email: z.string().email(),
  displayName: z.string().trim().min(1),
  roles: z.array(UserRoleSchema),
});

export type CourseStatus = 'draft' | 'published' | 'archived';
export interface Course {
  id: EntityId;
  instructorId: EntityId;
  title: string;
  status: CourseStatus;
}

export const CourseStatusSchema = z.enum(['draft', 'published', 'archived']);
export const CourseSchema = z.object({
  id: EntityIdSchema,
  instructorId: EntityIdSchema,
  title: z.string().trim().min(1),
  status: CourseStatusSchema,
});

export interface Section {
  id: EntityId;
  courseId: EntityId;
  title: string;
  position: number;
}

export const SectionSchema = z.object({
  id: EntityIdSchema,
  courseId: EntityIdSchema,
  title: z.string().trim().min(1),
  position: z.number().int().min(0),
});

export interface Lesson {
  id: EntityId;
  sectionId: EntityId;
  title: string;
  position: number;
  mediaAssetId?: EntityId;
}

export const LessonSchema = z.object({
  id: EntityIdSchema,
  sectionId: EntityIdSchema,
  title: z.string().trim().min(1),
  position: z.number().int().min(0),
  mediaAssetId: EntityIdSchema.optional(),
});

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';
export interface Enrollment {
  id: EntityId;
  userId: EntityId;
  courseId: EntityId;
  status: EnrollmentStatus;
  enrolledAt: IsoDateTime;
}

export const EnrollmentStatusSchema = z.enum([
  'active',
  'completed',
  'cancelled',
]);
export const EnrollmentSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  courseId: EntityIdSchema,
  status: EnrollmentStatusSchema,
  enrolledAt: IsoDateTimeSchema,
});

export type MediaAssetStatus = 'pending' | 'processing' | 'ready' | 'failed';
export interface MediaAsset {
  id: EntityId;
  ownerId: EntityId;
  status: MediaAssetStatus;
  storageKey?: string;
}

export const MediaAssetStatusSchema = z.enum([
  'pending',
  'processing',
  'ready',
  'failed',
]);
export const MediaAssetSchema = z.object({
  id: EntityIdSchema,
  ownerId: EntityIdSchema,
  status: MediaAssetStatusSchema,
  storageKey: z.string().trim().min(1).optional(),
});

export interface Quiz {
  id: EntityId;
  lessonId: EntityId;
  title: string;
}

export const QuizSchema = z.object({
  id: EntityIdSchema,
  lessonId: EntityIdSchema,
  title: z.string().trim().min(1),
});

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export interface LiveSession {
  id: EntityId;
  courseId: EntityId;
  provider: 'livekit';
  status: LiveSessionStatus;
  startsAt: IsoDateTime;
  endsAt?: IsoDateTime;
}

export const LiveSessionStatusSchema = z.enum([
  'scheduled',
  'live',
  'ended',
  'cancelled',
]);
export const LiveSessionSchema = z.object({
  id: EntityIdSchema,
  courseId: EntityIdSchema,
  provider: z.literal('livekit'),
  status: LiveSessionStatusSchema,
  startsAt: IsoDateTimeSchema,
  endsAt: IsoDateTimeSchema.optional(),
});

export type CommerceStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';
export interface Order {
  id: EntityId;
  userId: EntityId;
  courseId: EntityId;
  amountMinor: number;
  currency: string;
  status: CommerceStatus;
}

export const CommerceStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled',
]);
export const CurrencySchema = z.string().regex(/^[A-Z]{3}$/);
export const OrderSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  courseId: EntityIdSchema,
  amountMinor: z.number().int().nonnegative(),
  currency: CurrencySchema,
  status: CommerceStatusSchema,
});

export interface Payment {
  id: EntityId;
  orderId: EntityId;
  providerReference?: string;
  amountMinor: number;
  currency: string;
  status: CommerceStatus;
}

export const PaymentSchema = z.object({
  id: EntityIdSchema,
  orderId: EntityIdSchema,
  providerReference: z.string().trim().min(1).optional(),
  amountMinor: z.number().int().nonnegative(),
  currency: CurrencySchema,
  status: CommerceStatusSchema,
});

export interface LedgerEntry {
  id: EntityId;
  accountId: EntityId;
  amountMinor: number;
  currency: string;
  direction: 'credit' | 'debit';
  createdAt: IsoDateTime;
}

export const LedgerEntrySchema = z.object({
  id: EntityIdSchema,
  accountId: EntityIdSchema,
  amountMinor: z.number().int().nonnegative(),
  currency: CurrencySchema,
  direction: z.enum(['credit', 'debit']),
  createdAt: IsoDateTimeSchema,
});

export interface Payout {
  id: EntityId;
  instructorId: EntityId;
  amountMinor: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
}

export const PayoutSchema = z.object({
  id: EntityIdSchema,
  instructorId: EntityIdSchema,
  amountMinor: z.number().int().nonnegative(),
  currency: CurrencySchema,
  status: z.enum(['pending', 'paid', 'failed']),
});

export interface Certificate {
  id: EntityId;
  enrollmentId: EntityId;
  issuedAt: IsoDateTime;
}

export const CertificateSchema = z.object({
  id: EntityIdSchema,
  enrollmentId: EntityIdSchema,
  issuedAt: IsoDateTimeSchema,
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const PaginationMetadataSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function ApiSuccessEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    pagination: PaginationMetadataSchema.optional(),
  });
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export const ApiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().min(1),
  }),
});

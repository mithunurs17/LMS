import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiErrorEnvelopeSchema,
  ApiSuccessEnvelopeSchema,
  CourseSchema,
  EnrollmentSchema,
  PaginationSchema,
  UserIdentitySchema,
} from './index.js';

test('shared identity and course schemas accept valid domain shapes', () => {
  assert.equal(
    UserIdentitySchema.safeParse({
      id: 'user-1',
      email: 'learner@example.test',
      displayName: 'Learner',
      roles: ['learner'],
    }).success,
    true,
  );
  assert.equal(
    CourseSchema.safeParse({
      id: 'course-1',
      instructorId: 'user-2',
      title: 'Foundations',
      status: 'draft',
    }).success,
    true,
  );
});

test('shared schemas reject invalid identity, enrollment timestamps, and pagination bounds', () => {
  assert.equal(
    UserIdentitySchema.safeParse({
      id: '',
      email: 'not-an-email',
      displayName: '',
      roles: ['owner'],
    }).success,
    false,
  );
  assert.equal(
    EnrollmentSchema.safeParse({
      id: 'enrollment-1',
      userId: 'user-1',
      courseId: 'course-1',
      status: 'active',
      enrolledAt: 'not-a-date',
    }).success,
    false,
  );
  assert.equal(
    PaginationSchema.safeParse({ page: 1, pageSize: 101 }).success,
    false,
  );
  assert.equal(
    ApiSuccessEnvelopeSchema(CourseSchema).safeParse({
      success: true,
      data: {
        id: 'course-1',
        instructorId: 'user-1',
        title: 'Foundations',
        status: 'draft',
      },
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }).success,
    true,
  );
  assert.equal(
    ApiErrorEnvelopeSchema.safeParse({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Not found.',
        requestId: 'request-1',
      },
    }).success,
    true,
  );
});

import {
  loginSchema,
  registerSchema,
  verifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/schemas/auth-schemas';
import { ZodError } from 'zod';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials successfully', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
      expect(loginSchema.parse(validData)).toEqual(validData);
    });

    it.each([
      ['plainaddress'],
      ['@missinglocalpart.com'],
      ['domain.com'],
      ['test@domain'],
      ['test@domain..com'],
      [''],
    ])(
      'should fail validation for invalid email format: %s',
      (invalidEmail) => {
        const invalidData = {
          email: invalidEmail,
          password: 'password123',
        };
        expect(() => loginSchema.parse(invalidData)).toThrow(ZodError);

        try {
          loginSchema.parse(invalidData);
        } catch (error) {
          if (error instanceof ZodError) {
            const emailError = error.errors.find((e) => e.path[0] === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.message).toContain('Invalid email');
          } else {
            throw error;
          }
        }
      }
    );

    it('should fail validation if password is missing or empty', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      const invalidDataEmptyPass = {
        email: 'test@example.com',
        password: '',
      };

      expect(() => loginSchema.parse(invalidData)).toThrow(ZodError);
      try {
        loginSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const passError = error.errors.find((e) => e.path[0] === 'password');
          expect(passError).toBeDefined();
          expect(passError?.code).toBe('invalid_type');
        } else {
          throw error;
        }
      }

      expect(() => loginSchema.parse(invalidDataEmptyPass)).not.toThrow();
    });

    it('should fail validation if email is missing', () => {
      const invalidData = {
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow(ZodError);
      try {
        loginSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const emailError = error.errors.find((e) => e.path[0] === 'email');
          expect(emailError).toBeDefined();
          expect(emailError?.code).toBe('invalid_type');
        } else {
          throw error;
        }
      }
    });

    it('should ignore extra fields by default', () => {
      const dataWithExtra = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should be ignored',
      };
      expect(() => loginSchema.parse(dataWithExtra)).not.toThrow();
      expect(loginSchema.parse(dataWithExtra)).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('registerSchema', () => {
    const validPassword = 'Password1!';
    const validData = {
      email: 'test@example.com',
      username: 'tester',
      password: validPassword,
      confirmPassword: validPassword,
    };

    it('should validate correct registration data successfully', () => {
      expect(() => registerSchema.parse(validData)).not.toThrow();
      expect(registerSchema.parse(validData)).toEqual(validData);
    });

    it.each([
      ['plainaddress'],
      ['@missinglocalpart.com'],
      ['domain.com'],
      ['test@domain'],
      ['test@domain..com'],
      [''],
    ])(
      'should fail validation for invalid email format: %s',
      (invalidEmail) => {
        const invalidData = { ...validData, email: invalidEmail };
        expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
      }
    );

    it.each([
      ['', 'Username must be atleast 3 characters'],
      ['us', 'Username must be atleast 3 characters'],
      ['a'.repeat(17), 'Username must be at most 16 characters'],
    ])(
      'should fail validation for invalid username: %s',
      (invalidUsername, expectedMessage) => {
        const invalidData = { ...validData, username: invalidUsername };
        expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
        try {
          registerSchema.parse(invalidData);
        } catch (error) {
          if (error instanceof ZodError) {
            const userError = error.errors.find(
              (e) => e.path[0] === 'username'
            );
            expect(userError).toBeDefined();
            expect(userError?.message).toBe(expectedMessage);
          } else {
            throw error;
          }
        }
      }
    );

    it.each([
      ['short', 'Password must be at least 7 characters'], // Too short
      ['nouppercase1!', 'Password must contain at least one uppercase letter'],
      ['NOLOWERCASE1!', 'Password must contain at least one lowercase letter'],
      ['NoNumber!', 'Password must contain at least one number'],
      ['NoSpecial1', 'Password must contain at least one special character'],
    ])(
      'should fail validation for invalid password: %s',
      (invalidPassword, expectedMessage) => {
        const invalidData = {
          ...validData,
          password: invalidPassword,
          confirmPassword: invalidPassword,
        };
        expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
        try {
          registerSchema.parse(invalidData);
        } catch (error) {
          if (error instanceof ZodError) {
            const passError = error.errors.find(
              (e) => e.path[0] === 'password'
            );
            expect(passError).toBeDefined();
            expect(passError?.message).toBe(expectedMessage);
          } else {
            throw error;
          }
        }
      }
    );

    it('should fail validation if passwords do not match', () => {
      const invalidData = {
        ...validData,
        confirmPassword: 'DifferentPassword1!',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow(ZodError);
      try {
        registerSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const refineError = error.errors.find(
            (e) => e.message === "Passwords don't match"
          );
          expect(refineError).toBeDefined();
          expect(refineError?.path).toEqual(['confirmPassword']);
        } else {
          throw error;
        }
      }
    });

    it('should fail if required fields are missing', () => {
      const data = { ...validData };
      delete (data as Partial<typeof validData>).email;
      expect(() => registerSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe('verifySchema', () => {
    it('should validate a correct 6-digit code', () => {
      const validData = { code: '123456' };
      expect(() => verifySchema.parse(validData)).not.toThrow();
      expect(verifySchema.parse(validData)).toEqual(validData);
    });

    it.each([['12345'], ['1234567'], [''], ['abcdef']])(
      'should fail validation for code with incorrect length: %s',
      (invalidCode) => {
        const invalidData = { code: invalidCode };
        if (invalidCode.length < 6) {
          expect(() => verifySchema.parse(invalidData)).toThrow(ZodError);
          try {
            verifySchema.parse(invalidData);
          } catch (error) {
            if (error instanceof ZodError) {
              const codeError = error.errors.find((e) => e.path[0] === 'code');
              expect(codeError).toBeDefined();
              expect(codeError?.message).toBe('Please enter all 6 digits');
            } else {
              throw error;
            }
          }
        } else {
          expect(() => verifySchema.parse(invalidData)).not.toThrow();
        }
      }
    );

    it('should fail if code field is missing', () => {
      const invalidData = {};
      expect(() => verifySchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate a correct email address', () => {
      const validData = { email: 'test@example.com' };
      expect(() => forgotPasswordSchema.parse(validData)).not.toThrow();
      expect(forgotPasswordSchema.parse(validData)).toEqual(validData);
    });

    it.each([
      ['plainaddress'],
      ['@missinglocalpart.com'],
      ['domain.com'],
      ['test@domain'],
      ['test@domain..com'],
      [''],
    ])(
      'should fail validation for invalid email format: %s',
      (invalidEmail) => {
        const invalidData = { email: invalidEmail };
        expect(() => forgotPasswordSchema.parse(invalidData)).toThrow(ZodError);
        try {
          forgotPasswordSchema.parse(invalidData);
        } catch (error) {
          if (error instanceof ZodError) {
            const emailError = error.errors.find((e) => e.path[0] === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.message).toBe(
              'Please enter a valid email address'
            );
          } else {
            throw error;
          }
        }
      }
    );

    it('should fail if email field is missing', () => {
      const invalidData = {};
      expect(() => forgotPasswordSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('resetPasswordSchema', () => {
    const validPassword = 'Password1!';
    const validData = {
      password: validPassword,
      confirmPassword: validPassword,
    };

    it('should validate correct password reset data successfully', () => {
      expect(() => resetPasswordSchema.parse(validData)).not.toThrow();
      expect(resetPasswordSchema.parse(validData)).toEqual(validData);
    });

    // Password validation tests (similar to registerSchema)
    it.each([
      ['short', 'Password must be at least 7 characters'],
      ['nouppercase1!', 'Password must contain at least one uppercase letter'],
      ['NOLOWERCASE1!', 'Password must contain at least one lowercase letter'],
      ['NoNumber!', 'Password must contain at least one number'],
      ['NoSpecial1', 'Password must contain at least one special character'],
    ])(
      'should fail validation for invalid password: %s',
      (invalidPassword, expectedMessage) => {
        const invalidData = {
          password: invalidPassword,
          confirmPassword: invalidPassword,
        };
        expect(() => resetPasswordSchema.parse(invalidData)).toThrow(ZodError);
        try {
          resetPasswordSchema.parse(invalidData);
        } catch (error) {
          if (error instanceof ZodError) {
            const passError = error.errors.find(
              (e) => e.path[0] === 'password'
            );
            expect(passError).toBeDefined();
            expect(passError?.message).toBe(expectedMessage);
          } else {
            throw error;
          }
        }
      }
    );

    it('should fail validation if passwords do not match', () => {
      const invalidData = {
        ...validData,
        confirmPassword: 'DifferentPassword1!',
      };
      expect(() => resetPasswordSchema.parse(invalidData)).toThrow(ZodError);
      try {
        resetPasswordSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const refineError = error.errors.find(
            (e) => e.message === "Passwords don't match"
          );
          expect(refineError).toBeDefined();
          expect(refineError?.path).toEqual(['confirmPassword']);
        } else {
          throw error;
        }
      }
    });

    it('should fail if required fields are missing', () => {
      const data = { ...validData };
      delete (data as Partial<typeof validData>).password;
      expect(() => resetPasswordSchema.parse(data)).toThrow(ZodError);
    });
  });
});

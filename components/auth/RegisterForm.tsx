// Файл: RegisterForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { authClient, useSession } from '@/lib/auth-client';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Имя должно быть не менее 2 символов').max(50, 'Имя слишком длинное'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const router = useRouter();
  const { mutate: refreshSession } = useSession();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validate = (): boolean => {
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    startTransition(async () => {
      try {
        console.log('🔵 [RegisterForm] Attempting registration...');
        const result = await authClient.signUp(formData.email, formData.password, formData.name);

        console.log('🔵 [RegisterForm] Registration result:', result);

        if (result.error) {
          console.error('❌ [RegisterForm] Registration error:', result.error);
          const errorMsg = typeof result.error.message === 'string' 
            ? result.error.message 
            : 'Ошибка при регистрации';
          setServerError(errorMsg);
          return;
        }

        console.log('✅ [RegisterForm] Registration successful, refreshing session...');
        // Обновляем сессию на клиенте
        await refreshSession();
        
        // Вызываем callback успеха, если есть
        if (onSuccess) {
          onSuccess();
        }
        
        // Делаем полный редирект на главную
        window.location.href = '/';
      } catch (err: unknown) {
        console.error('❌ [RegisterForm] Registration exception:', err);
        setServerError(err instanceof Error ? err.message : 'Произошла ошибка при регистрации. Попробуйте снова.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg text-sm">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Имя
        </label>
        <input
          id="reg-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-all"
          placeholder="Ваше имя"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-all"
          placeholder="example@email.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Пароль
        </label>
        <input
          id="reg-password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-all"
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Подтвердите пароль
        </label>
        <input
          id="reg-confirm"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-all"
          placeholder="••••••••"
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
      >
        {isPending ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Уже есть аккаунт?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Войти
        </button>
      </p>
    </form>
  );
};

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronLeft,
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { authApi } from "~/api/auth";
import { profileApi, type Profile } from "~/api/profile";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formLastName, setFormLastName] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formMiddleName, setFormMiddleName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await profileApi.getMyProfile();
        if (!data) {
          setError("Вы не авторизованы");
          return;
        }
        setProfile(data);
        setFormLastName(data.lastName ?? "");
        setFormFirstName(data.firstName ?? "");
        setFormMiddleName(data.middleName ?? "");
      } catch (err) {
        console.error("Profile load error:", err);
        setError(
          err instanceof Error
            ? `Не удалось загрузить профиль: ${err.message}`
            : "Не удалось загрузить профиль",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const fullName = profile
    ? [profile.lastName, profile.firstName, profile.middleName]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const initials = profile
    ? `${(profile.firstName ?? "").charAt(0)}${(profile.lastName ?? "").charAt(0)}`.toUpperCase() ||
      (profile.login ?? "?").charAt(0).toUpperCase()
    : "?";

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await profileApi.updateMyProfile({
        lastName: formLastName.trim(),
        firstName: formFirstName.trim(),
        middleName: formMiddleName.trim() || null,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setFormLastName(profile.lastName ?? "");
    setFormFirstName(profile.firstName ?? "");
    setFormMiddleName(profile.middleName ?? "");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      router.push("/");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await profileApi.deleteMyProfile();
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Не удалось удалить аккаунт");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAvatarChange = () => {
    alert("Загрузка аватара пока недоступна");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">Загрузка профиля...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error ?? "Профиль не найден"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#F62877] hover:text-[#F62877]"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>На главную</span>
      </Link>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <button
          type="button"
          onClick={handleAvatarChange}
          className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28"
          aria-label="Изменить аватар"
        >
          <span className="flex h-full w-full items-center justify-center bg-[#F62877] text-3xl font-bold text-white">
            {initials}
          </span>
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6" />
            <span className="text-xs font-medium">Изменить</span>
          </span>
        </button>

        <div className="flex flex-1 flex-col items-center sm:items-start">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {fullName || "Имя не указано"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {profile.email ?? profile.login}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#F62877] hover:text-[#F62877]"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <PlaceholderCard
          icon={<Package className="h-6 w-6" />}
          title="Мои заказы"
          subtitle="Здесь появится история заказов"
        />
        <PlaceholderCard
          icon={<Heart className="h-6 w-6" />}
          title="Избранное"
          subtitle="Сохранённые товары"
          href="/wishlist"
        />
        <PlaceholderCard
          icon={<MapPin className="h-6 w-6" />}
          title="Адрес доставки"
          subtitle="Не указан"
        />
        <PlaceholderCard
          icon={<Settings className="h-6 w-6" />}
          title="Настройки аккаунта"
          subtitle={isEditing ? "Редактирование..." : "Изменить ФИО"}
          onClick={() => setIsEditing((prev) => !prev)}
          active={isEditing}
        />
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900">
              Удалить аккаунт?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Это действие нельзя отменить. Все ваши данные будут удалены навсегда.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl bg-red-600 px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Удаление..." : "Да, удалить"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-2xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Настройки аккаунта
            </h2>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <Field
              label="Фамилия"
              value={formLastName}
              onChange={setFormLastName}
            />
            <Field
              label="Имя"
              value={formFirstName}
              onChange={setFormFirstName}
            />
            <Field
              label="Отчество"
              value={formMiddleName}
              onChange={setFormMiddleName}
              optional
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#F62877] px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="rounded-2xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>
          </div>

          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-red-700">Удалить аккаунт</h3>
                <p className="mt-1 text-sm text-red-600">
                  Действие необратимо. Профиль и все связанные данные будут удалены.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Trash2 className="h-4 w-4" />
                Удалить аккаунт
              </button>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function PlaceholderCard({
  icon,
  title,
  subtitle,
  onClick,
  href,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const baseClasses =
    "flex items-center gap-4 rounded-3xl border bg-white p-5 text-left transition-colors";
  const interactiveClasses = onClick || href
    ? "cursor-pointer hover:border-[#F62877]"
    : "";
  const stateClasses = active ? "border-[#F62877]" : "border-gray-200";

  const content = (
    <>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-[#F62877]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="truncate text-sm text-gray-500">{subtitle}</p>
      </div>
      {(onClick || href) && (
        <Pencil className="ml-auto h-4 w-4 flex-shrink-0 text-gray-400" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${interactiveClasses} ${stateClasses}`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses} ${stateClasses}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${stateClasses}`}>{content}</div>
  );
}

function Field({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-gray-400">(необязательно)</span>
        )}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 outline-none focus:border-[#F62877]"
      />
    </label>
  );
}

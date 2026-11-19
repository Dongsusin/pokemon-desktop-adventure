export const trainerAvatars = ['male', 'female'] as const
export type TrainerAvatar = typeof trainerAvatars[number]

export function isTrainerAvatar(value: unknown): value is TrainerAvatar {
  return value === 'male' || value === 'female'
}

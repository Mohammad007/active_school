/** Bundled brand images (static requires only — Metro cannot resolve dynamic ones). */
import logo from '../../assets/images/logo.png';
import logoWhite from '../../assets/images/logo-white.png';
import mark from '../../assets/images/mark.png';
import onboardingStudents from '../../assets/images/onboarding-students.png';
import onboardingSports from '../../assets/images/onboarding-sports.png';
import football from '../../assets/images/characters/football.png';
import basketball from '../../assets/images/characters/basketball.png';
import running from '../../assets/images/characters/running.png';
import yoga from '../../assets/images/characters/yoga.png';
import avatarBoy from '../../assets/images/characters/avatar-boy.png';
import avatarGirl from '../../assets/images/characters/avatar-girl.png';

export const Brand = {
  logo,
  logoWhite,
  mark,
  /** Wordmark aspect ratio (1024 x 170). */
  logoAspect: 1024 / 170,
} as const;

/** Hand-drawn characters used on onboarding, empty states and headers. */
export const Illustrations = {
  students: onboardingStudents,
  sports: onboardingSports,
  football,
  basketball,
  running,
  yoga,
} as const;

export type IllustrationKey = keyof typeof Illustrations;

/** Placeholder portraits shown until a student adds a photo. */
export const Characters = {
  boy: avatarBoy,
  girl: avatarGirl,
} as const;

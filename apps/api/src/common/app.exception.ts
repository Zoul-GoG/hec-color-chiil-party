import { HttpException } from '@nestjs/common';
import { ErrorCode, type ApiErrorBody } from '@hcc/shared';

/** Default French messages, mirrored by the front (docs/03-API.md §1). */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Requête invalide.',
  INVALID_GUEST_ID: 'Recharge la page et réessaie.',
  UNAUTHORIZED: 'Authentification requise.',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  NOT_FOUND: 'Ressource introuvable.',
  TRACK_NOT_FOUND: 'Morceau introuvable.',
  TRACK_HIDDEN: "Ce morceau n'est pas disponible pour la soirée.",
  SUBMISSIONS_CLOSED: 'Les propositions sont closes, place à la fête !',
  RATE_LIMITED: 'Doucement DJ 😅 Réessaie dans un instant.',
  DEEZER_UNAVAILABLE: 'La recherche est momentanément indisponible.',
  INTERNAL_ERROR: 'Oups, une erreur est survenue.',
};

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  INVALID_GUEST_ID: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  NOT_FOUND: 404,
  TRACK_NOT_FOUND: 404,
  TRACK_HIDDEN: 409,
  SUBMISSIONS_CLOSED: 403,
  RATE_LIMITED: 429,
  DEEZER_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

/** Business error carrying an `ErrorCode`; rendered by `AllExceptionsFilter`. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string = ERROR_MESSAGES[code],
  ) {
    super({ statusCode: STATUS[code], code, message } satisfies ApiErrorBody, STATUS[code]);
  }
}

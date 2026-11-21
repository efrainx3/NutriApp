import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor que normaliza errores HTTP en mensajes empáticos y sin culpa
 * para la interfaz de NutriRuta.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const mensajeNormalizado =
          err.status === 0
            ? 'Sin conexión en este momento. Guardaremos tu avance en el dispositivo para enviarlo al reconectar.'
            : err.error?.mensaje ??
              'No pudimos completar la solicitud en este momento. Intenta de nuevo en unos segundos.';

        return throwError(
          () =>
            new HttpErrorResponse({
              error: {
                ...err.error,
                mensajeAmigable: mensajeNormalizado,
              },
              headers: err.headers,
              status: err.status,
              statusText: err.statusText,
              url: err.url ?? req.url,
            })
        );
      }
      return throwError(() => err);
    })
  );

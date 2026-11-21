import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'paciente',
    canActivate: [roleGuard('paciente')],
    loadComponent: () =>
      import('./features/registro/pages/paciente-shell.page').then(
        (m) => m.PacienteShellPageComponent
      ),
    children: [
      {
        path: 'hoy',
        loadComponent: () =>
          import('./features/registro/pages/hoy.page').then(
            (m) => m.HoyPageComponent
          ),
      },
      {
        path: 'registrar/:tipo',
        loadComponent: () =>
          import('./features/registro/pages/registrar-comida.page').then(
            (m) => m.RegistrarComidaPageComponent
          ),
      },
      {
        path: 'mi-plan',
        loadComponent: () =>
          import('./features/registro/pages/mi-plan-paciente.page').then(
            (m) => m.MiPlanPacientePageComponent
          ),
      },
      {
        path: 'progreso',
        loadComponent: () =>
          import('./features/registro/pages/progreso-paciente.page').then(
            (m) => m.ProgresoPacientePageComponent
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/registro/pages/perfil-paciente.page').then(
            (m) => m.PerfilPacientePageComponent
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'hoy',
      },
    ],
  },
  {
    path: 'profesional',
    canActivate: [roleGuard('profesional')],
    loadComponent: () =>
      import('./features/pacientes/pages/panel-profesional.page').then(
        (m) => m.PanelProfesionalPageComponent
      ),
    children: [
      {
        path: 'valoracion',
        loadComponent: () =>
          import('./features/valoracion/pages/valoracion.page').then(
            (m) => m.ValoracionPageComponent
          ),
      },
      {
        path: 'plan',
        loadComponent: () =>
          import('./features/planes/pages/asignar-plan.page').then(
            (m) => m.AsignarPlanPageComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

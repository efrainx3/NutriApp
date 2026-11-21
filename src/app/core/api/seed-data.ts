import { NivelCumplimiento } from '../../shared/util/calculos';
import { EstadoSincronizacion } from '../../shared/ui/aviso-estado/aviso-estado.component';

export type RolUsuario = 'profesional' | 'paciente';

export interface UsuarioSesion {
  readonly id: string;
  readonly nombre: string;
  readonly rol: RolUsuario;
  readonly pacienteId?: string;
  readonly especialidad?: string;
}

export type TipoComida = 'desayuno' | 'media-manana' | 'almuerzo' | 'merienda' | 'cena';

export interface ComidaPlan {
  readonly tipo: TipoComida;
  readonly nombre: string;
  readonly horarioSugerido: string;
  readonly descripcion: string;
  readonly porcionesIdeales: string;
}

export interface PlantillaPlan {
  readonly id: string;
  readonly nombre: string;
  readonly objetivoClinico: string;
  readonly kcalEstimadas: number;
  readonly comidas: readonly ComidaPlan[];
}

export interface RegistroComida {
  readonly id: string;
  readonly pacienteId: string;
  readonly fecha: string; // YYYY-MM-DD
  readonly tipoComida: TipoComida;
  readonly nombreComida: string;
  readonly cumplimiento: NivelCumplimiento;
  readonly nota?: string;
  readonly estadoSincronizacion: EstadoSincronizacion;
  readonly creadoEn: string;
}

export interface MedicionSemanal {
  readonly semana: number;
  readonly etiqueta: string; // 'Sem 1' .. 'Sem 8'
  readonly fecha: string;
  readonly pesoKg: number;
  readonly adherenciaPorcentaje: number;
}

export interface ValoracionClinica {
  readonly id: string;
  readonly pacienteId: string;
  readonly fecha: string;
  readonly datosGenerales: {
    readonly motivoConsulta: string;
    readonly gestante: boolean;
    readonly semanasGestacion: number | null;
  };
  readonly antropometria: {
    readonly pesoKg: number;
    readonly tallaCm: number;
    readonly circunferenciaCinturaCm: number;
  };
  readonly laboratorios: {
    readonly glucosaAyunasMgDl: number;
    readonly hba1cPorcentaje: number;
    readonly trigliceridosMgDl: number;
  };
  readonly habitos: {
    readonly horasSueno: number;
    readonly actividadFisicaMinSem: number;
    readonly consumoAguaLitros: number;
  };
  readonly objetivos: {
    readonly metaPrincipal: string;
    readonly proximoControlFecha: string;
  };
}

export interface PacienteResumen {
  readonly id: string;
  readonly nombre: string;
  readonly edad: number;
  readonly diagnostico: string;
  readonly tallaCm: number;
  readonly pesoActualKg: number;
  readonly pesoInicialKg: number;
  readonly adherenciaActual: number;
  readonly adherenciaTendenciaBaja: boolean;
  readonly proximoControl: string;
  readonly planAsignadoId: string;
  readonly planAsignadoNombre: string;
}

export interface FichaPacienteDetalle {
  readonly paciente: PacienteResumen;
  readonly planActivo: PlantillaPlan;
  readonly ultimaValoracion: ValoracionClinica | null;
}

export interface EvolucionPacienteData {
  readonly pacienteId: string;
  readonly tallaCm: number;
  readonly mediciones: readonly MedicionSemanal[];
}

export interface HoyPacienteResponse {
  readonly fechaHoy: string;
  readonly paciente: PacienteResumen;
  readonly planActivo: PlantillaPlan;
  readonly registrosHoy: readonly RegistroComida[];
  readonly registrosSemana: readonly RegistroComida[];
}

/**
 * Usuarios de prueba obligatorios: Dra. Camila y Jorge R.
 */
export const USUARIOS_SEMILLA: readonly UsuarioSesion[] = [
  {
    id: 'usr-camila',
    nombre: 'Dra. Camila Restrepo',
    rol: 'profesional',
    especialidad: 'Nutrición Clínica y Metabólica (60 pacientes activos)',
  },
  {
    id: 'usr-jorge',
    nombre: 'Jorge R.',
    rol: 'paciente',
    pacienteId: 'pac-jorge',
  },
];

/**
 * 3 Plantillas de plan nutricional
 */
export const PLANTILLAS_PLAN_SEMILLA: readonly PlantillaPlan[] = [
  {
    id: 'plan-glucemico',
    nombre: 'Control Glucémico — Prediabetes Activa',
    objetivoClinico: 'Estabilizar curva glucémica posprandial y reducir HbA1c con fibra soluble.',
    kcalEstimadas: 1850,
    comidas: [
      {
        tipo: 'desayuno',
        nombre: 'Desayuno',
        horarioSugerido: '07:30',
        descripcion: 'Huevos pericos con tomate y cebolla, arepa de maíz integral pequeña y aguacate.',
        porcionesIdeales: '2 huevos + 1 arepa delgada + 1/4 aguacate + café sin azúcar',
      },
      {
        tipo: 'media-manana',
        nombre: 'Media mañana',
        horarioSugerido: '10:30',
        descripcion: 'Yogur griego natural sin azúcar añadida con semillas de chía y almendras.',
        porcionesIdeales: '1 vaso (150 g) + 10 almendras + 1 cdta chía',
      },
      {
        tipo: 'almuerzo',
        nombre: 'Almuerzo',
        horarioSugerido: '13:00',
        descripcion: 'Pechuga a la plancha, lentejas guisadas, ensalada verde fresca y arroz integral.',
        porcionesIdeales: '150 g proteína + 1/2 taza leguminosa + 1/2 plato vegetales',
      },
      {
        tipo: 'merienda',
        nombre: 'Merienda',
        horarioSugerido: '16:30',
        descripcion: 'Manzana verde con cáscara y queso campesino bajo en grasa.',
        porcionesIdeales: '1 unidad mediana + 40 g queso fresco',
      },
      {
        tipo: 'cena',
        nombre: 'Cena',
        horarioSugerido: '19:30',
        descripcion: 'Filete de trucha o tilapia al horno con brócoli salteado y quinua.',
        porcionesIdeales: '140 g pescado + 1 taza vegetales al vapor + 1/3 taza quinua',
      },
    ],
  },
  {
    id: 'plan-cardio',
    nombre: 'Cardioprotector Mediterráneo Adaptado',
    objetivoClinico: 'Optimizar perfil lipídico y presión arterial con grasas monoinsaturadas.',
    kcalEstimadas: 1950,
    comidas: [
      {
        tipo: 'desayuno',
        nombre: 'Desayuno',
        horarioSugerido: '07:30',
        descripcion: 'Avena cocida en agua con canela, nueces picadas y fresas enteras.',
        porcionesIdeales: '4 cdas avena en hojuelas + 1/2 taza fresas + 4 nueces',
      },
      {
        tipo: 'media-manana',
        nombre: 'Media mañana',
        horarioSugerido: '10:30',
        descripcion: 'Pera pequeña y puñado de pistachos o maní natural sin sal.',
        porcionesIdeales: '1 fruta entera + 20 g frutos secos',
      },
      {
        tipo: 'almuerzo',
        nombre: 'Almuerzo',
        horarioSugerido: '13:00',
        descripcion: 'Salmón o trucha a la plancha, garbanzos con espinaca y ensalada de tomate con oliva.',
        porcionesIdeales: '150 g pescado azul + 1/2 taza garbanzos + 1 cda aceite de oliva',
      },
      {
        tipo: 'merienda',
        nombre: 'Merienda',
        horarioSugerido: '16:30',
        descripcion: 'Bastones de zanahoria y apio con hummus casero de garbanzo.',
        porcionesIdeales: '1 taza bastones vegetales + 2 cdas hummus',
      },
      {
        tipo: 'cena',
        nombre: 'Cena',
        horarioSugerido: '19:30',
        descripcion: 'Crema natural de ahuyama sin crema de leche y pollo desmechado con aguacate.',
        porcionesIdeales: '1 plato mediano + 120 g pechuga desmechada',
      },
    ],
  },
  {
    id: 'plan-sostenible',
    nombre: 'Mantenimiento Metabólico Flexible',
    objetivoClinico: 'Sostener hábitos saludables a largo plazo con saciedad y densidad nutricional.',
    kcalEstimadas: 2050,
    comidas: [
      {
        tipo: 'desayuno',
        nombre: 'Desayuno',
        horarioSugerido: '07:30',
        descripcion: 'Tostada de pan masa madre con huevo pochado, espinaca y queso fresco.',
        porcionesIdeales: '1 tajada masa madre + 2 huevos + hojas verdes',
      },
      {
        tipo: 'media-manana',
        nombre: 'Media mañana',
        horarioSugerido: '10:30',
        descripcion: 'Mandarina entera y semillas de calabaza.',
        porcionesIdeales: '1-2 mandarinas + 1 cda semillas',
      },
      {
        tipo: 'almuerzo',
        nombre: 'Almuerzo',
        horarioSugerido: '13:00',
        descripcion: 'Lomo magro salteado con vegetales, papa criolla horneada y aguacate.',
        porcionesIdeales: '150 g corte magro + 4 papas pequeñas con piel + ensalada',
      },
      {
        tipo: 'merienda',
        nombre: 'Merienda',
        horarioSugerido: '16:30',
        descripcion: 'Kéfir o kumis sin azúcar con arándanos frescos.',
        porcionesIdeales: '150 ml bebida fermentada + 1/3 taza arándanos',
      },
      {
        tipo: 'cena',
        nombre: 'Cena',
        horarioSugerido: '19:30',
        descripcion: 'Tortilla de claras y huevo entero con champiñones y calabacín.',
        porcionesIdeales: '2 huevos + 1 taza champiñones salteados',
      },
    ],
  },
];

export const FECHA_HOY_SEMILLA = '2026-11-21';

/**
 * 6 Pacientes semilla (Jorge R. con adherencia en baja para destacar primero en la lista)
 */
const PACIENTES_INICIALES: readonly PacienteResumen[] = [
  {
    id: 'pac-jorge',
    nombre: 'Jorge R.',
    edad: 45,
    diagnostico: 'Prediabetes (HbA1c 6,1 %) y sobrepeso central',
    tallaCm: 172,
    pesoInicialKg: 87.4,
    pesoActualKg: 84.2,
    adherenciaActual: 68,
    adherenciaTendenciaBaja: true,
    proximoControl: '2026-11-28',
    planAsignadoId: 'plan-glucemico',
    planAsignadoNombre: 'Control Glucémico — Prediabetes Activa',
  },
  {
    id: 'pac-elena',
    nombre: 'Elena Morales',
    edad: 52,
    diagnostico: 'Dislipidemia mixta e hipertensión controlada',
    tallaCm: 161,
    pesoInicialKg: 74.0,
    pesoActualKg: 71.5,
    adherenciaActual: 62,
    adherenciaTendenciaBaja: true,
    proximoControl: '2026-11-26',
    planAsignadoId: 'plan-cardio',
    planAsignadoNombre: 'Cardioprotector Mediterráneo Adaptado',
  },
  {
    id: 'pac-carlos',
    nombre: 'Carlos Mendoza',
    edad: 39,
    diagnostico: 'Resistencia a la insulina e hígado graso grado I',
    tallaCm: 178,
    pesoInicialKg: 93.0,
    pesoActualKg: 88.8,
    adherenciaActual: 88,
    adherenciaTendenciaBaja: false,
    proximoControl: '2026-12-03',
    planAsignadoId: 'plan-glucemico',
    planAsignadoNombre: 'Control Glucémico — Prediabetes Activa',
  },
  {
    id: 'pac-lucia',
    nombre: 'Lucía Fernández',
    edad: 31,
    diagnostico: 'Control nutricional gestacional trimestre II',
    tallaCm: 165,
    pesoInicialKg: 63.2,
    pesoActualKg: 65.4,
    adherenciaActual: 92,
    adherenciaTendenciaBaja: false,
    proximoControl: '2026-12-01',
    planAsignadoId: 'plan-sostenible',
    planAsignadoNombre: 'Mantenimiento Metabólico Flexible',
  },
  {
    id: 'pac-andres',
    nombre: 'Andrés Villamizar',
    edad: 58,
    diagnostico: 'Síndrome metabólico en remisión parcial',
    tallaCm: 170,
    pesoInicialKg: 85.0,
    pesoActualKg: 80.5,
    adherenciaActual: 85,
    adherenciaTendenciaBaja: false,
    proximoControl: '2026-12-05',
    planAsignadoId: 'plan-cardio',
    planAsignadoNombre: 'Cardioprotector Mediterráneo Adaptado',
  },
  {
    id: 'pac-mariana',
    nombre: 'Mariana Duarte',
    edad: 28,
    diagnostico: 'Recomposición corporal y educación alimentaria',
    tallaCm: 164,
    pesoInicialKg: 68.5,
    pesoActualKg: 65.9,
    adherenciaActual: 91,
    adherenciaTendenciaBaja: false,
    proximoControl: '2026-12-10',
    planAsignadoId: 'plan-sostenible',
    planAsignadoNombre: 'Mantenimiento Metabólico Flexible',
  },
];

/**
 * Genera 8 semanas de mediciones para cada paciente.
 * Para Jorge R., baja 3,2 kg en 8 semanas (de 87,4 kg a 84,2 kg) y adherencia con leve descenso reciente.
 */
function crearEvolucionInicial(): Record<string, MedicionSemanal[]> {
  return {
    'pac-jorge': [
      { semana: 1, etiqueta: 'Sem 1', fecha: '2026-10-03', pesoKg: 87.4, adherenciaPorcentaje: 82 },
      { semana: 2, etiqueta: 'Sem 2', fecha: '2026-10-10', pesoKg: 86.9, adherenciaPorcentaje: 85 },
      { semana: 3, etiqueta: 'Sem 3', fecha: '2026-10-17', pesoKg: 86.3, adherenciaPorcentaje: 80 },
      { semana: 4, etiqueta: 'Sem 4', fecha: '2026-10-24', pesoKg: 85.8, adherenciaPorcentaje: 78 },
      { semana: 5, etiqueta: 'Sem 5', fecha: '2026-10-31', pesoKg: 85.3, adherenciaPorcentaje: 76 },
      { semana: 6, etiqueta: 'Sem 6', fecha: '2026-11-07', pesoKg: 84.9, adherenciaPorcentaje: 72 },
      { semana: 7, etiqueta: 'Sem 7', fecha: '2026-11-14', pesoKg: 84.5, adherenciaPorcentaje: 70 },
      { semana: 8, etiqueta: 'Sem 8', fecha: '2026-11-21', pesoKg: 84.2, adherenciaPorcentaje: 68 },
    ],
    'pac-elena': [
      { semana: 1, etiqueta: 'Sem 1', fecha: '2026-10-03', pesoKg: 74.0, adherenciaPorcentaje: 80 },
      { semana: 2, etiqueta: 'Sem 2', fecha: '2026-10-10', pesoKg: 73.6, adherenciaPorcentaje: 78 },
      { semana: 3, etiqueta: 'Sem 3', fecha: '2026-10-17', pesoKg: 73.2, adherenciaPorcentaje: 75 },
      { semana: 4, etiqueta: 'Sem 4', fecha: '2026-10-24', pesoKg: 72.9, adherenciaPorcentaje: 73 },
      { semana: 5, etiqueta: 'Sem 5', fecha: '2026-10-31', pesoKg: 72.5, adherenciaPorcentaje: 70 },
      { semana: 6, etiqueta: 'Sem 6', fecha: '2026-11-07', pesoKg: 72.1, adherenciaPorcentaje: 67 },
      { semana: 7, etiqueta: 'Sem 7', fecha: '2026-11-14', pesoKg: 71.8, adherenciaPorcentaje: 64 },
      { semana: 8, etiqueta: 'Sem 8', fecha: '2026-11-21', pesoKg: 71.5, adherenciaPorcentaje: 62 },
    ],
    'pac-carlos': [
      { semana: 1, etiqueta: 'Sem 1', fecha: '2026-10-03', pesoKg: 93.0, adherenciaPorcentaje: 80 },
      { semana: 2, etiqueta: 'Sem 2', fecha: '2026-10-10', pesoKg: 92.3, adherenciaPorcentaje: 84 },
      { semana: 3, etiqueta: 'Sem 3', fecha: '2026-10-17', pesoKg: 91.7, adherenciaPorcentaje: 85 },
      { semana: 4, etiqueta: 'Sem 4', fecha: '2026-10-24', pesoKg: 91.1, adherenciaPorcentaje: 87 },
      { semana: 5, etiqueta: 'Sem 5', fecha: '2026-10-31', pesoKg: 90.4, adherenciaPorcentaje: 86 },
      { semana: 6, etiqueta: 'Sem 6', fecha: '2026-11-07', pesoKg: 89.8, adherenciaPorcentaje: 89 },
      { semana: 7, etiqueta: 'Sem 7', fecha: '2026-11-14', pesoKg: 89.3, adherenciaPorcentaje: 88 },
      { semana: 8, etiqueta: 'Sem 8', fecha: '2026-11-21', pesoKg: 88.8, adherenciaPorcentaje: 88 },
    ],
    'pac-lucia': [
      { semana: 1, etiqueta: 'Sem 1', fecha: '2026-10-03', pesoKg: 63.2, adherenciaPorcentaje: 90 },
      { semana: 2, etiqueta: 'Sem 2', fecha: '2026-10-10', pesoKg: 63.5, adherenciaPorcentaje: 91 },
      { semana: 3, etiqueta: 'Sem 3', fecha: '2026-10-17', pesoKg: 63.8, adherenciaPorcentaje: 93 },
      { semana: 4, etiqueta: 'Sem 4', fecha: '2026-10-24', pesoKg: 64.1, adherenciaPorcentaje: 92 },
      { semana: 5, etiqueta: 'Sem 5', fecha: '2026-10-31', pesoKg: 64.4, adherenciaPorcentaje: 94 },
      { semana: 6, etiqueta: 'Sem 6', fecha: '2026-11-07', pesoKg: 64.7, adherenciaPorcentaje: 91 },
      { semana: 7, etiqueta: 'Sem 7', fecha: '2026-11-14', pesoKg: 65.1, adherenciaPorcentaje: 92 },
      { semana: 8, etiqueta: 'Sem 8', fecha: '2026-11-21', pesoKg: 65.4, adherenciaPorcentaje: 92 },
    ],
    'pac-andres': [
      { semana: 1, etiqueta: 'Sem 1', fecha: '2026-10-03', pesoKg: 85.0, adherenciaPorcentaje: 79 },
      { semana: 2, etiqueta: 'Sem 2', fecha: '2026-10-10', pesoKg: 84.3, adherenciaPorcentaje: 81 },
      { semana: 3, etiqueta: 'Sem 3', fecha: '2026-10-17', pesoKg: 83.7, adherenciaPorcentaje: 83 },
      { semana: 4, etiqueta: 'Sem 4', fecha: '2026-10-24', pesoKg: 83.0, adherenciaPorcentaje: 84 },
      { semana: 5, etiqueta: 'Sem 5', fecha: '2026-10-31', pesoKg: 82.4, adherenciaPorcentaje: 85 },
      { semana: 6, etiqueta: 'Sem 6', fecha: '2026-11-07', pesoKg: 81.8, adherenciaPorcentaje: 86 },
      { semana: 7, etiqueta: 'Sem 7', fecha: '2026-11-14', pesoKg: 81.1, adherenciaPorcentaje: 85 },
      { semana: 8, etiqueta: 'Sem 8', fecha: '2026-11-21', pesoKg: 80.5, adherenciaPorcentaje: 85 },
    ],
    'pac-mariana': [
      { semana: 1, etiqueta: 'Sem 1', fecha: '2026-10-03', pesoKg: 68.5, adherenciaPorcentaje: 88 },
      { semana: 2, etiqueta: 'Sem 2', fecha: '2026-10-10', pesoKg: 68.1, adherenciaPorcentaje: 89 },
      { semana: 3, etiqueta: 'Sem 3', fecha: '2026-10-17', pesoKg: 67.7, adherenciaPorcentaje: 90 },
      { semana: 4, etiqueta: 'Sem 4', fecha: '2026-10-24', pesoKg: 67.3, adherenciaPorcentaje: 91 },
      { semana: 5, etiqueta: 'Sem 5', fecha: '2026-10-31', pesoKg: 66.9, adherenciaPorcentaje: 90 },
      { semana: 6, etiqueta: 'Sem 6', fecha: '2026-11-07', pesoKg: 66.5, adherenciaPorcentaje: 92 },
      { semana: 7, etiqueta: 'Sem 7', fecha: '2026-11-14', pesoKg: 66.2, adherenciaPorcentaje: 91 },
      { semana: 8, etiqueta: 'Sem 8', fecha: '2026-11-21', pesoKg: 65.9, adherenciaPorcentaje: 91 },
    ],
  };
}

/**
 * Genera 3 semanas de registros históricos por paciente.
 * En el día de hoy (2026-11-21), Jorge R. ya registró desayuno y media mañana,
 * y tiene pendientes de registrar el almuerzo, la merienda y la cena (ideal para la demo).
 */
function crearRegistrosIniciales(): Record<string, RegistroComida[]> {
  const fechasTresSemanas = [
    '2026-11-01',
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
  ];

  const resultado: Record<string, RegistroComida[]> = {};

  for (const pac of PACIENTES_INICIALES) {
    const lista: RegistroComida[] = [];
    fechasTresSemanas.forEach((fecha, idx) => {
      // Últimos 7 días de Jorge: cumplidos 4 días previos + hoy (= 5 de 7 días al registrar hoy)
      if (pac.id === 'pac-jorge' && (fecha === '2026-11-16' || fecha === '2026-11-19')) {
        lista.push({
          id: `reg-${pac.id}-${idx}-alm`,
          pacienteId: pac.id,
          fecha,
          tipoComida: 'almuerzo',
          nombreComida: 'Almuerzo',
          cumplimiento: 'no-seguido',
          nota: 'Almuerzo de trabajo fuera de casa',
          estadoSincronizacion: 'sincronizado',
          creadoEn: `${fecha}T13:15:00Z`,
        });
        return;
      }

      const cumplimiento: NivelCumplimiento =
        idx % 5 === 0 ? 'parcial' : 'completo';

      lista.push({
        id: `reg-${pac.id}-${idx}-des`,
        pacienteId: pac.id,
        fecha,
        tipoComida: 'desayuno',
        nombreComida: 'Desayuno',
        cumplimiento,
        estadoSincronizacion: 'sincronizado',
        creadoEn: `${fecha}T07:45:00Z`,
      });
    });

    // Registros de hoy (2026-11-21) para Jorge R.: Desayuno y Media mañana ya sincronizados
    if (pac.id === 'pac-jorge') {
      lista.push(
        {
          id: 'reg-pac-jorge-hoy-desayuno',
          pacienteId: 'pac-jorge',
          fecha: FECHA_HOY_SEMILLA,
          tipoComida: 'desayuno',
          nombreComida: 'Desayuno',
          cumplimiento: 'completo',
          nota: 'Arepa integral con huevos pericos y aguacate',
          estadoSincronizacion: 'sincronizado',
          creadoEn: `${FECHA_HOY_SEMILLA}T07:40:00Z`,
        },
        {
          id: 'reg-pac-jorge-hoy-media-manana',
          pacienteId: 'pac-jorge',
          fecha: FECHA_HOY_SEMILLA,
          tipoComida: 'media-manana',
          nombreComida: 'Media mañana',
          cumplimiento: 'parcial',
          nota: 'Tomé el yogur natural, sin almendras',
          estadoSincronizacion: 'sincronizado',
          creadoEn: `${FECHA_HOY_SEMILLA}T10:35:00Z`,
        }
      );
    }

    resultado[pac.id] = lista;
  }

  return resultado;
}

function crearValoracionesIniciales(): Record<string, ValoracionClinica> {
  return {
    'pac-jorge': {
      id: 'val-jorge-inicial',
      pacienteId: 'pac-jorge',
      fecha: '2026-11-14',
      datosGenerales: {
        motivoConsulta: 'Control de prediabetes y reducción de perímetro abdominal',
        gestante: false,
        semanasGestacion: null,
      },
      antropometria: {
        pesoKg: 84.2,
        tallaCm: 172,
        circunferenciaCinturaCm: 98,
      },
      laboratorios: {
        glucosaAyunasMgDl: 108,
        hba1cPorcentaje: 6.1,
        trigliceridosMgDl: 165,
      },
      habitos: {
        horasSueno: 6.5,
        actividadFisicaMinSem: 120,
        consumoAguaLitros: 1.8,
      },
      objetivos: {
        metaPrincipal: 'Aumentar fibra en almuerzo y cena; caminar 30 min poscena',
        proximoControlFecha: '2026-11-28',
      },
    },
  };
}

/**
 * Estado en memoria compartida del backend simulado.
 * Lo que registra el paciente persiste en memoria durante la sesión del navegador
 * y se refleja inmediatamente al cambiar de rol y entrar como nutricionista.
 */
export interface BaseDatosMemoria {
  pacientes: PacienteResumen[];
  plantillas: PlantillaPlan[];
  evoluciones: Record<string, MedicionSemanal[]>;
  registros: Record<string, RegistroComida[]>;
  valoraciones: Record<string, ValoracionClinica>;
}

export function crearBaseDatosSemilla(): BaseDatosMemoria {
  return {
    pacientes: PACIENTES_INICIALES.map((p) => ({ ...p })),
    plantillas: PLANTILLAS_PLAN_SEMILLA.map((pl) => ({
      ...pl,
      comidas: pl.comidas.map((c) => ({ ...c })),
    })),
    evoluciones: crearEvolucionInicial(),
    registros: crearRegistrosIniciales(),
    valoraciones: crearValoracionesIniciales(),
  };
}

import servicioAlertas from '../services/servicioAlertas';
import lecturas from '../../data/lecturas-ejemplo.json';

const usuarioDemo = { usuario: 'tester' };

describe('servicioAlertas', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('normaliza configuración y guarda versiones', async () => {
        const cfg = servicioAlertas.obtenerConfig();
        expect(cfg.ventanaDias).toBeGreaterThan(0);
        expect(cfg.reglas).toBeDefined();

        const resultado = await servicioAlertas.guardarConfigVersionada(
            {
                ...cfg,
                ventanaDias: 5,
                severidadPorDefecto: 'alta'
            },
            usuarioDemo
        );

        expect(resultado.success).toBe(true);
        const historial = servicioAlertas.obtenerHistorial();
        expect(historial.length).toBe(1);
        expect(historial[0].config.ventanaDias).toBe(5);
        expect(historial[0].config.severidadPorDefecto).toBe('alta');
    });

    it('simular genera alertas con lecturas históricas y umbral bajo', () => {
        const cfg = servicioAlertas.obtenerConfig();
        const reglas = {
            ...cfg.reglas,
            consumo_diesel: {
                ...cfg.reglas.consumo_diesel,
                umbral: 10,
                severidad: 'critica'
            }
        };
        const resultados = servicioAlertas.simular({ ...cfg, reglas }, lecturas, cfg.ventanaDias);
        expect(Array.isArray(resultados)).toBe(true);
        expect(resultados.length).toBeGreaterThan(0);
        const alerta = resultados[0];
        expect(alerta.indicador).toBeDefined();
        expect(alerta.umbral).toBe(10);
        expect(alerta.severidad).toBe('critica');
        expect(alerta.ventana).toBeDefined();
        expect(alerta.ventana.muestras).toBeGreaterThan(0);
    });

    it('registrarAlertas enriquece y persiste', () => {
        const alerta = {
            indicador: 'demo',
            indicadorNombre: 'Alerta Demo',
            timestamp: new Date().toISOString(),
            valor: 100,
            umbral: 80,
            severidad: 'alta'
        };
        const res = servicioAlertas.registrarAlertas([alerta], usuarioDemo);
        expect(res.success).toBe(true);
        expect(res.added).toBe(1);
        expect(res.alertas[0].registradoPor).toBe(usuarioDemo.usuario);

        const res2 = servicioAlertas.registrarAlertas([alerta], usuarioDemo);
        expect(res2.success).toBe(true);
    });
});

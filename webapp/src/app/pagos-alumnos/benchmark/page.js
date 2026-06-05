'use client'
import { useState } from 'react'
import '../pagos_alumnos.css'
const ENDPOINTS = [
    {
        nombre: 'Dashboard',
        metodo: 'GET',
        url: '/pagos-alumnos/dashboard',
        tipo: 'Lectura / Resumen',
    },
    {
        nombre: 'Alumnos con pago',
        metodo: 'GET',
        url: '/pagos-alumnos/con-pago?mes=2026-06',
        tipo: 'Lectura / Consulta',
    },
    {
        nombre: 'Alumnos sin pago',
        metodo: 'GET',
        url: '/pagos-alumnos/sin-pago?mes=2026-06',
        tipo: 'Lectura / Consulta',
    },
    {
        nombre: 'Reporte financiero',
        metodo: 'GET',
        url: '/pagos-alumnos/reportes/financiero',
        tipo: 'Agregación / Reporte',
    },
]

const CONFIG = {
    rondasSecuenciales: 5,
    usuariosConcurrentes: 10,
    rondasConcurrentes: 3,
}

function formatoMs(ms) {
    return `${Number(ms || 0).toFixed(2)} ms`
}

function formatoNumero(n) {
    return Number(n || 0).toFixed(2)
}

function percentil(valores, p) {
    if (!valores.length) return 0

    const ordenados = [...valores].sort((a, b) => a - b)
    const indice = Math.ceil((p / 100) * ordenados.length) - 1

    return ordenados[Math.max(0, Math.min(indice, ordenados.length - 1))]
}

function clasificarLatencia(ms) {
    if (ms <= 200) return 'Excelente'
    if (ms <= 500) return 'Aceptable'
    if (ms <= 1000) return 'Mejorable'
    return 'Crítica'
}

function claseLatencia(ms) {
    if (ms <= 500) return 'badge-activo'
    if (ms <= 1000) return 'badge-warning'
    return 'badge-inactivo'
}

export default function BenchmarkPagos() {
    const [resultados, setResultados] = useState([])
    const [resumen, setResumen] = useState(null)
    const [porEndpoint, setPorEndpoint] = useState([])
    const [ejecutando, setEjecutando] = useState(false)
    const [fase, setFase] = useState('En espera')

    async function medirEndpoint(endpoint, modo, ronda, usuarioVirtual = 1) {
        const inicio = performance.now()

        try {
            const res = await fetch(endpoint.url, {
                method: endpoint.metodo,
                cache: 'no-store',
            })

            const fin = performance.now()
            const tiempo = fin - inicio

            return {
                ...endpoint,
                modo,
                ronda,
                usuario_virtual: usuarioVirtual,
                status: res.status,
                ok: res.ok,
                tiempo,
                tiempo_formateado: formatoMs(tiempo),
                resultado: res.ok ? 'Correcto' : 'Error',
                clasificacion: clasificarLatencia(tiempo),
            }

        } catch (err) {
            const fin = performance.now()
            const tiempo = fin - inicio

            return {
                ...endpoint,
                modo,
                ronda,
                usuario_virtual: usuarioVirtual,
                status: 'Fallo',
                ok: false,
                tiempo,
                tiempo_formateado: formatoMs(tiempo),
                resultado: err.message,
                clasificacion: 'Crítica',
            }
        }
    }

    function calcularMetricas(datos, inicioGlobal, finGlobal) {
        const tiempos = datos.map(d => d.tiempo)
        const total = datos.length
        const exitosos = datos.filter(d => d.ok).length
        const fallidos = total - exitosos
        const duracionSegundos = Math.max((finGlobal - inicioGlobal) / 1000, 0.001)

        const promedio = tiempos.reduce((sum, t) => sum + t, 0) / total
        const minimo = Math.min(...tiempos)
        const maximo = Math.max(...tiempos)
        const p95 = percentil(tiempos, 95)
        const p99 = percentil(tiempos, 99)
        const throughput = total / duracionSegundos
        const tasaExito = (exitosos / total) * 100
        const tasaError = (fallidos / total) * 100

        const secuenciales = datos.filter(d => d.modo === 'Secuencial')
        const concurrentes = datos.filter(d => d.modo === 'Concurrente')

        const promedioSecuencial = secuenciales.length
            ? secuenciales.reduce((s, d) => s + d.tiempo, 0) / secuenciales.length
            : 0

        const promedioConcurrente = concurrentes.length
            ? concurrentes.reduce((s, d) => s + d.tiempo, 0) / concurrentes.length
            : 0

        const factorDegradacion = promedioSecuencial > 0
            ? promedioConcurrente / promedioSecuencial
            : 0

        let elasticidad = 'Buena'

        if (factorDegradacion > 2 || tasaError > 5) {
            elasticidad = 'Limitada'
        } else if (factorDegradacion > 1.4) {
            elasticidad = 'Aceptable'
        }

        return {
            total,
            exitosos,
            fallidos,
            promedio,
            minimo,
            maximo,
            p95,
            p99,
            throughput,
            tasaExito,
            tasaError,
            duracionSegundos,
            promedioSecuencial,
            promedioConcurrente,
            factorDegradacion,
            elasticidad,

            promedio_formateado: formatoMs(promedio),
            minimo_formateado: formatoMs(minimo),
            maximo_formateado: formatoMs(maximo),
            p95_formateado: formatoMs(p95),
            p99_formateado: formatoMs(p99),
            throughput_formateado: `${formatoNumero(throughput)} req/s`,
            tasa_exito_formateada: `${formatoNumero(tasaExito)}%`,
            tasa_error_formateada: `${formatoNumero(tasaError)}%`,
            duracion_formateada: `${formatoNumero(duracionSegundos)} s`,
            promedio_secuencial_formateado: formatoMs(promedioSecuencial),
            promedio_concurrente_formateado: formatoMs(promedioConcurrente),
            factor_degradacion_formateado: `${formatoNumero(factorDegradacion)}x`,
        }
    }

    function calcularPorEndpoint(datos) {
        return ENDPOINTS.map(endpoint => {
            const items = datos.filter(d => d.nombre === endpoint.nombre)
            const tiempos = items.map(i => i.tiempo)
            const exitosos = items.filter(i => i.ok).length
            const fallidos = items.length - exitosos
            const promedio = tiempos.length
                ? tiempos.reduce((s, t) => s + t, 0) / tiempos.length
                : 0

            return {
                nombre: endpoint.nombre,
                tipo: endpoint.tipo,
                metodo: endpoint.metodo,
                url: endpoint.url,
                total: items.length,
                exitosos,
                fallidos,
                promedio,
                minimo: tiempos.length ? Math.min(...tiempos) : 0,
                maximo: tiempos.length ? Math.max(...tiempos) : 0,
                p95: percentil(tiempos, 95),
                tasa_exito: items.length ? (exitosos / items.length) * 100 : 0,
                promedio_formateado: formatoMs(promedio),
                minimo_formateado: formatoMs(tiempos.length ? Math.min(...tiempos) : 0),
                maximo_formateado: formatoMs(tiempos.length ? Math.max(...tiempos) : 0),
                p95_formateado: formatoMs(percentil(tiempos, 95)),
                tasa_exito_formateada: `${formatoNumero(items.length ? (exitosos / items.length) * 100 : 0)}%`,
                clasificacion: clasificarLatencia(promedio),
            }
        })
    }

    async function ejecutarBenchmark() {
        setEjecutando(true)
        setResultados([])
        setResumen(null)
        setPorEndpoint([])
        setFase('Prueba secuencial')

        const datos = []
        const inicioGlobal = performance.now()

        for (let ronda = 1; ronda <= CONFIG.rondasSecuenciales; ronda++) {
            for (const endpoint of ENDPOINTS) {
                const resultado = await medirEndpoint(endpoint, 'Secuencial', ronda, 1)
                datos.push(resultado)
                setResultados([...datos])
            }
        }

        setFase('Prueba concurrente')

        for (let ronda = 1; ronda <= CONFIG.rondasConcurrentes; ronda++) {
            const lote = []

            for (let usuario = 1; usuario <= CONFIG.usuariosConcurrentes; usuario++) {
                for (const endpoint of ENDPOINTS) {
                    lote.push(medirEndpoint(endpoint, 'Concurrente', ronda, usuario))
                }
            }

            const resultadosLote = await Promise.all(lote)
            datos.push(...resultadosLote)
            setResultados([...datos])
        }

        const finGlobal = performance.now()

        setResumen(calcularMetricas(datos, inicioGlobal, finGlobal))
        setPorEndpoint(calcularPorEndpoint(datos))
        setFase('Finalizado')
        setEjecutando(false)
    }

    return (
        <div className="uspg-page pa-wrap">
            <div className="pa-header">
                <div>
                    <h1>Benchmark <span style={{ color: 'var(--uspg-corinto)' }}>Pagos Alumnos</span></h1>
                    <p style={{ color: 'var(--uspg-muted)', marginTop: '0.4rem' }}>
                        Prueba de rendimiento, latencia, estabilidad y elasticidad del módulo de pagos.
                    </p>
                    <p style={{ color: 'var(--uspg-muted)', fontSize: '0.8rem' }}>
                        Fase actual: <strong>{fase}</strong>
                    </p>
                </div>

                <button
                    className="lab-btn-primary"
                    onClick={ejecutarBenchmark}
                    disabled={ejecutando}
                >
                    {ejecutando ? 'Ejecutando...' : 'Ejecutar Benchmark'}
                </button>
            </div>

            {resumen && (
                <>
                    <div className="pa-report-grid">
                        <div className="pa-report-card">
                            <span>Total solicitudes</span>
                            <strong>{resumen.total}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Tasa de éxito</span>
                            <strong>{resumen.tasa_exito_formateada}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Tasa de error</span>
                            <strong>{resumen.tasa_error_formateada}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Throughput</span>
                            <strong>{resumen.throughput_formateado}</strong>
                        </div>
                    </div>

                    <div className="pa-report-grid" style={{ marginTop: '1rem' }}>
                        <div className="pa-report-card">
                            <span>Latencia promedio</span>
                            <strong>{resumen.promedio_formateado}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Latencia p95</span>
                            <strong>{resumen.p95_formateado}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Latencia p99</span>
                            <strong>{resumen.p99_formateado}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Máxima</span>
                            <strong>{resumen.maximo_formateado}</strong>
                        </div>
                    </div>

                    <div className="pa-report-grid" style={{ marginTop: '1rem' }}>
                        <div className="pa-report-card">
                            <span>Promedio secuencial</span>
                            <strong>{resumen.promedio_secuencial_formateado}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Promedio concurrente</span>
                            <strong>{resumen.promedio_concurrente_formateado}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Factor degradación</span>
                            <strong>{resumen.factor_degradacion_formateado}</strong>
                        </div>

                        <div className="pa-report-card">
                            <span>Elasticidad estimada</span>
                            <strong>{resumen.elasticidad}</strong>
                        </div>
                    </div>
                </>
            )}

            <div className="lab-table-wrap" style={{ padding: '1rem', marginTop: '1rem' }}>
                <div className="pa-table-header">
                    <h3>Métricas por endpoint</h3>
                </div>

                <table className="lab-table">
                    <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Tipo</th>
                        <th>Solicitudes</th>
                        <th>Éxito</th>
                        <th>Promedio</th>
                        <th>p95</th>
                        <th>Máximo</th>
                        <th>Clasificación</th>
                    </tr>
                    </thead>
                    <tbody>
                    {porEndpoint.length === 0 ? (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--uspg-muted)' }}>
                                Ejecuta la prueba para generar métricas por endpoint.
                            </td>
                        </tr>
                    ) : porEndpoint.map((r, i) => (
                        <tr key={i}>
                            <td>{r.nombre}</td>
                            <td>{r.tipo}</td>
                            <td>{r.total}</td>
                            <td>{r.tasa_exito_formateada}</td>
                            <td><strong>{r.promedio_formateado}</strong></td>
                            <td>{r.p95_formateado}</td>
                            <td>{r.maximo_formateado}</td>
                            <td>
                                <span className={claseLatencia(r.promedio)}>
                                    {r.clasificacion}
                                </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="lab-table-wrap" style={{ padding: '1rem', marginTop: '1rem' }}>
                <div className="pa-table-header">
                    <h3>Resultados detallados</h3>
                </div>

                <table className="lab-table">
                    <thead>
                    <tr>
                        <th>Modo</th>
                        <th>Ronda</th>
                        <th>VU</th>
                        <th>Endpoint</th>
                        <th>Método</th>
                        <th>Status</th>
                        <th>Tiempo</th>
                        <th>Resultado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {resultados.length === 0 ? (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--uspg-muted)' }}>
                                Presiona “Ejecutar Benchmark” para iniciar la prueba.
                            </td>
                        </tr>
                    ) : resultados.map((r, i) => (
                        <tr key={`${r.nombre}-${r.ronda}-${r.usuario_virtual}-${i}`}>
                            <td>{r.modo}</td>
                            <td>{r.ronda}</td>
                            <td>{r.usuario_virtual}</td>
                            <td>{r.nombre}</td>
                            <td>{r.metodo}</td>
                            <td>
                                <span className={r.ok ? 'badge-activo' : 'badge-inactivo'}>
                                    {r.status}
                                </span>
                            </td>
                            <td><strong>{r.tiempo_formateado}</strong></td>
                            <td>{r.resultado}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="lab-table-wrap" style={{ padding: '1rem', marginTop: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Interpretación para la rúbrica</h3>
                <p style={{ color: 'var(--uspg-muted)', lineHeight: 1.6 }}>
                    El benchmark mide latencia mínima, promedio, máxima, percentiles p95 y p99,
                    tasa de éxito, tasa de error, throughput estimado y comportamiento bajo concurrencia.
                    La elasticidad se estima comparando la latencia promedio secuencial contra la latencia promedio
                    concurrente. Si el sistema mantiene baja degradación y baja tasa de error, se considera estable
                    para cargas simultáneas moderadas.
                </p>

                {resumen && (
                    <p style={{ color: 'var(--uspg-muted)', lineHeight: 1.6 }}>
                        Resultado: el módulo procesó <strong>{resumen.total}</strong> solicitudes en{' '}
                        <strong>{resumen.duracion_formateada}</strong>, con throughput estimado de{' '}
                        <strong>{resumen.throughput_formateado}</strong>, tasa de éxito de{' '}
                        <strong>{resumen.tasa_exito_formateada}</strong> y elasticidad estimada como{' '}
                        <strong>{resumen.elasticidad}</strong>.
                    </p>
                )}
            </div>
        </div>
    )
}
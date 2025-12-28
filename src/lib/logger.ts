/**
 * Logger estruturado para a aplicação
 * Silencia logs em produção, mantém em desenvolvimento
 * 
 * Uso:
 * import { logger } from '@/lib/logger';
 * logger.info('Mensagem informativa');
 * logger.error('Erro:', error);
 * logger.warn('Aviso');
 * logger.debug('Debug info');
 */

const isDev = import.meta.env.DEV;
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: unknown;
}

const formatLog = (level: LogLevel, message: string, data?: unknown): LogEntry => ({
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
});

const shouldLog = (level: LogLevel): boolean => {
    // Sempre logar erros
    if (level === 'error') return true;

    // Em produção, só logar warnings e erros
    if (!isDev) return level === 'warn';

    // Em dev, logar tudo exceto debug (a menos que debug esteja habilitado)
    if (level === 'debug') return isDebugEnabled;

    return true;
};

const getConsoleMethod = (level: LogLevel): typeof console.log => {
    switch (level) {
        case 'error': return console.error;
        case 'warn': return console.warn;
        case 'debug': return console.debug;
        default: return console.log;
    }
};

const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    if (!shouldLog(level)) return;

    const entry = formatLog(level, message, args.length > 0 ? args : undefined);
    const consoleMethod = getConsoleMethod(level);

    const prefix = `[${level.toUpperCase()}]`;

    if (args.length > 0) {
        consoleMethod(prefix, message, ...args);
    } else {
        consoleMethod(prefix, message);
    }

    return entry;
};

export const logger = {
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),

    // Método para erros com stack trace
    exception: (message: string, error: unknown) => {
        log('error', message, error);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
    },
};

export default logger;

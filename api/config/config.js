import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
    DATABASE: {
        HOST: process.env.DB_HOST || 'localhost',
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_ROOT_PASSWORD || '',
        NAME: process.env.DB_NAME || 'recordatorios',
        PORT: process.env.DB_PORT || 3306,
        DIALECT: process.env.DB_DIALECT || 'mysql'
    },
    PORT: process.env.API_PORT || 80,
    // Compartida con fichada (HS256): valida localmente los JWT de sus usuarios.
    SECRET_KEY: process.env.SECRET_KEY || 'token',
    AUTH_API_URL: process.env.AUTH_API_URL,
    MAILER_API_URL: process.env.MAILER_API_URL,
    // El login (incluido el PIN) se delega a fichada_api: mismos usuarios y mismo PIN.
    FICHADA_API_URL: process.env.FICHADA_API_URL || 'http://fichada_api',
    WEB_URL: process.env.WEB_URL,
    AUTHORIZATION: {
        USER: process.env.AUTH_BASIC_USER || 'auth',
        PASSWORD: process.env.AUTH_BASIC_PW || 'secret',
    },
    MAILER_AUTH: {
        USER: process.env.MAILER_BASIC_USER || 'mailer',
        PASSWORD: process.env.MAILER_BASIC_PW || 'secret',
    },
};

export default CONFIG;

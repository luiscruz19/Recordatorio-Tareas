import sequelize from './sequelize.js';
// sync() solo conoce los modelos ya importados.
import '../models/index.js';

(async () => {
    try {
        await sequelize.authenticate();
        console.info('Conexión a la base de datos establecida correctamente');

        // En producción no se alteran tablas existentes: esos cambios van en db/migrations.
        const isProduction = process.env.NODE_ENV === 'production';
        await sequelize.sync({ alter: !isProduction });

        console.info(
            `Modelos sincronizados (${isProduction ? 'producción: solo crear' : 'desarrollo: alter'})`
        );
    } catch (error) {
        console.error('No se pudo conectar/sincronizar la base de datos:', error.message);
    }
})();

export default sequelize;

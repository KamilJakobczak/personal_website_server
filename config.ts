import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

dotenv.config({ path: path.resolve(__dirname, '.env') });

const envFile =
  process.env.NODE_ENV === 'production' ? 'env.production' : 'env.development';

dotenv.config({ path: path.resolve(__dirname, envFile) });

interface ConfigInterface {
  database: string | undefined;
  sessions: string | undefined;
  secret: string | false;
  apolloKey: string | undefined;
  apolloGraphRef: string | undefined;
  apolloSchemaReport: string | undefined;
}
const config: ConfigInterface = {
  database: process.env.DATABASE_URL,
  sessions: process.env.SESSIONS_URL,
  secret: process.env.SECRET || false,
  apolloKey: process.env.APOLLO_KEY,
  apolloGraphRef: process.env.APOLLO_GRAPH_REF,
  apolloSchemaReport: process.env.APOLLO_SCHEMA_REPORTING,
};

export default config;

import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

dotenv.config({ path: path.resolve(__dirname, '.env') });

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: path.resolve(__dirname, envFile) });

interface ConfigInterface {
  database: string | undefined;
  sessions: string | undefined;
  secret: string;
  apolloKey: string | undefined;
  apolloGraphRef: string | undefined;
  apolloSchemaReport: string | undefined;
  graphqlAPI: string | undefined;
  host: string | undefined;
  backPort: string | undefined;
  frontPort: string | undefined;
}
const config: ConfigInterface = {
  database: process.env.DATABASE_URL,
  sessions: process.env.SESSIONS_URL,
  secret: process.env.SECRET || '7B1644BD8BBEF8285BB9DAAD7172F',
  apolloKey: process.env.APOLLO_KEY,
  apolloGraphRef: process.env.APOLLO_GRAPH_REF,
  apolloSchemaReport: process.env.APOLLO_SCHEMA_REPORTING,
  graphqlAPI: process.env.GRAPHQL_PATH,
  host: process.env.HOST,
  backPort: process.env.BACK_PORT,
  frontPort: process.env.FRONT_PORT,
};

export default config;

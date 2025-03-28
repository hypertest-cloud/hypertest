import type { APIGatewayEvent, Context } from 'aws-lambda';
import { handler } from './index.js';

handler({} as APIGatewayEvent, {} as Context);

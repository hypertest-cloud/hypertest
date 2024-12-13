import { InvokeCommand, InvokeCommandInput, Lambda } from "@aws-sdk/client-lambda";

interface CreateLambdaParams {
  client: Lambda;
  args: InvokeCommandInput;
}

export const create = async (params: CreateLambdaParams): Promise<string> => {
  try {
    const command = new InvokeCommand(params.args);
    const { Payload } = await params.client.send(command);

    if (!Payload) {
      throw new Error('Lambda Payload error.');
    }
    const result = Buffer.from(Payload).toString();

    return result;
  } catch (error) {
    console.error('Error when creating Lambda: ', error);

    throw error;
  }
}

export const lambda = {
  create,
}

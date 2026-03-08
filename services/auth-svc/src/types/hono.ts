import { Env } from "./env";

export type HonoEnv = {
  Bindings: Env;
  Variables: {
    user: {
      user_id: string;
      email: string;
      role: string;
    };
  };
};

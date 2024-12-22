import envvars from "./envvars";

export const checkHealth = () => {
  for (const key of Object.keys(envvars)) {
    if (!envvars[key as keyof typeof envvars])
      throw new Error(`No value provided for ${key}`);
  }

  if (envvars.INPUT_DIR === envvars.OUTPUT_DIR)
    throw new Error("INPUT_DIR and OUTPUT_DIR cannot be the same");
};

export const createTemplateMetadata = () => {
  const createdAt = Date.now();
  return {
    id: `tmp-${createdAt}`,
    createdAt,
  };
};

// Publish each section as soon as it arrives. A slow or failed secondary
// request must not hold back the rest of the page.
export function independentSection<T>(
  request: () => Promise<T>,
  publish: (data: T) => void,
  isCurrent: () => boolean,
) {
  return async () => {
    const data = await request();
    if (isCurrent()) publish(data);
  };
}

export async function loadIndependentSections(
  tasks: Array<() => Promise<void>>,
  isCurrent: () => boolean,
  onError: (error: unknown) => void,
) {
  let reported = false;
  await Promise.all(
    tasks.map(async (task) => {
      try {
        await task();
      } catch (error) {
        if (isCurrent() && !reported) {
          reported = true;
          onError(error);
        }
      }
    }),
  );
}

import flatCache from "flat-cache";
import { either, option, task, taskEither } from "fp-ts";
import { constant, flow, pipe } from "fp-ts/function";
import { Task } from "fp-ts/Task";
import { TaskEither } from "fp-ts/TaskEither";
import { PackagesIndex } from "./domain";
import { taskEitherLogError } from "./utils";

const PACKAGE_INDEX_URL =
  process.env.PACKAGE_INDEX_URL ||
  "https://github.com/espanso/hub/releases/download/v1.0.0/package_index.json";

export const PACKAGE_INDEX_CACHE_ID = "packagesIndex";

const cache = flatCache.load(PACKAGE_INDEX_CACHE_ID);

export const clearPackagesIndexCache: Task<boolean> = task.fromIO(() =>
  flatCache.clearCacheById(PACKAGE_INDEX_CACHE_ID)
);

export const fetchPackagesIndex: TaskEither<Error, PackagesIndex> = pipe(
  pipe(
    cache.getKey(PACKAGE_INDEX_URL),
    option.fromNullable,
    option.fold(
      () =>
        pipe(
          taskEither.tryCatch(
            constant(fetch(PACKAGE_INDEX_URL)),
            either.toError
          ),
          taskEither.chain((response) =>
            taskEither.tryCatch(constant(response.json()), either.toError)
          ),
          taskEither.chain(
            flow(
              PackagesIndex.decode,
              either.mapLeft(either.toError),
              taskEither.fromEither
            )
          ),
          taskEither.map((pacakgesIndex) => {
            cache.setKey(PACKAGE_INDEX_URL, pacakgesIndex);
            cache.save();
            return cache.getKey(PACKAGE_INDEX_URL);
          })
        ),
      taskEither.of
    ),
    taskEitherLogError
  )
);

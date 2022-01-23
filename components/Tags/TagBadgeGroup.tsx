import { CrossIcon, majorScale } from "evergreen-ui";
import { array } from "fp-ts";
import { Eq } from "fp-ts/Eq";
import { pipe } from "fp-ts/function";
import { useEffect, useState } from "react";
import { Stack } from "../layout";
import { IconBadge } from "./IconBadge";
import { TagBadge } from "./TagBadge";

type Props = {
  tags: Array<string>;
  onClick: (tag: string) => unknown;
  onRemove?: (tags: string[], removed: string) => unknown;
};

const tagEq: Eq<string> = {
  equals: (x, y) => x.toLocaleLowerCase() === y.toLocaleLowerCase(),
};

export const TagBadgeGroup = (props: Props) => {
  const [tags, setTags] = useState(pipe(props.tags, array.uniq(tagEq)));
  useEffect(() => {
    setTags(pipe(props.tags, array.uniq(tagEq)));
  }, [props.tags]);
  const onRemove = props.onRemove || (() => {});
  const canBeRemoved = props.onRemove !== undefined;

  const makeRemovableBadge = (tag: string) => (
    <IconBadge
      text={tag}
      icon={() => <CrossIcon />}
      onClick={() => props.onClick(tag)}
      onIconClick={() => {
        const newTags = pipe(
          tags,
          array.filter((v) => !tagEq.equals(v, tag))
        );
        onRemove(newTags, tag);
        setTags(newTags);
      }}
    />
  );

  const makeNonRemovableBadge = (tag: string) => (
    <TagBadge key={tag} onClick={() => props.onClick(tag)}>
      {tag}
    </TagBadge>
  );

  const makeBadge = (tag: string) =>
    canBeRemoved ? makeRemovableBadge(tag) : makeNonRemovableBadge(tag);

  return (
    <Stack
      units={1}
      flexWrap="wrap"
      marginTop={majorScale(1)}
      marginBottom={majorScale(1)}
    >
      {pipe(tags, array.map(makeBadge))}
    </Stack>
  );
};

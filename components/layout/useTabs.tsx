import { Pane, Tab, Tablist } from "evergreen-ui";
import { option } from "fp-ts";
import { zipper } from "fp-ts-contrib";
import { pipe } from "fp-ts/function";
import { NonEmptyArray } from "fp-ts/NonEmptyArray";
import React, { useState } from "react";

type TabVariant = "topbar" | "sidebar";

type TabProps = {
  id: string;
  label: string;
  render: () => JSX.Element;
};

const foldVariant: <T>(match: { [k in TabVariant]: () => T }) => (
  variant: TabVariant
) => T = (match) => (variant) => match[variant]();

type CommonTabProps = {
  label: string;
  key: string;
  id: string;
  onSelect: () => unknown;
  isSelected: boolean;
  "aria-controls": string;
};

export const useTabs: (
  tabs: NonEmptyArray<TabProps>,
  variant?: TabVariant
) => [JSX.Element, JSX.Element, TabProps] = (tabs, variant = "topbar") => {
  const [ztabs, setTabs] = useState(
    pipe(tabs, zipper.fromNonEmptyArray, zipper.start)
  );

  const makeProps: (tab: TabProps) => CommonTabProps = (tab) => ({
    label: tab.label,
    key: tab.id,
    id: tab.id,
    onSelect: () =>
      pipe(
        ztabs,
        zipper.moveByFindFirst((t) => t.id === tab.id),
        option.map(setTabs)
      ),
    isSelected: tab.id === ztabs.focus.id,
    "aria-controls": `tab-${tab}`,
  });

  const makeTab: (
    variant: TabVariant
  ) => (props: CommonTabProps) => JSX.Element = (variant) =>
    pipe(
      variant,
      foldVariant({
        topbar: () => (props: CommonTabProps) =>
          (
            <Tab {...props} appearance="primary" justifyContent="center">
              {props.label}
            </Tab>
          ),
        sidebar: () => (props: CommonTabProps) =>
          (
            <Tab
              {...props}
              appearance="secondary"
              direction="vertical"
              justifyContent="left"
            >
              {props.label}
            </Tab>
          ),
      })
    );

  const tabList = pipe(
    ztabs,
    zipper.map(makeProps),
    zipper.map(makeTab(variant)),
    zipper.toNonEmptyArray,
    (tabs) =>
      pipe(
        variant,
        foldVariant({
          topbar: () => <Tablist>{tabs}</Tablist>,
          sidebar: () => (
            <Tablist display="flex" flexDirection="column">
              {tabs}
            </Tablist>
          ),
        })
      )
  );

  const panels = (
    <>
      {pipe(
        ztabs,
        zipper.map((tab) => (
          <Pane
            width="100%"
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tabpanel"
            aria-labelledby={tab.id}
            aria-hidden={tab.id !== ztabs.focus.id}
            display={tab.id === ztabs.focus.id ? "block" : "none"}
          >
            {tab.render()}
          </Pane>
        )),
        zipper.toNonEmptyArray
      )}
    </>
  );

  return [tabList, panels, ztabs.focus];
};

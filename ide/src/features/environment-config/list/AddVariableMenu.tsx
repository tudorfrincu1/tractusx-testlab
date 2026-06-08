/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 Catena-X Automotive Network e.V.
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import TextFieldsOutlinedIcon from "@mui/icons-material/TextFieldsOutlined";
import { Fragment } from "react";
import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { COMPLEX_BUILDER_CHOICES, VARIABLE_GROUP, type ComplexBuilderChoice } from "../model";
import { AddVariableOption } from "./AddVariableOption";
import { useAddVariableMenu } from "./useAddVariableMenu";

export interface AddVariableMenuProps {
  onAddSimple: () => void;
  onAddComplex: (choice: ComplexBuilderChoice) => void;
}

/** Identity of the simple-variable entry — kept beside the data-driven complex
 * choices so both render through the same option row. */
const SIMPLE_OPTION = {
  label: "Simple variable",
  description: "A typed value — provided now, requested at run, or generated.",
  Icon: TextFieldsOutlinedIcon,
} as const;

/** A single, group-labelled, selectable entry of the Add-variable menu. */
interface MenuOption {
  key: string;
  group: string;
  Icon: ComponentType<SvgIconProps>;
  label: string;
  description: string;
  onSelect: () => void;
}

/**
 * The "+ Add variable" control. Opens a popup where every entry — the simple
 * variable and each complex builder — is an obviously-clickable row (icon tile
 * + title + description) grouped under category headers, with hover, focus, and
 * full keyboard navigation, so a first-time user immediately sees what is
 * selectable and how the kinds are organized.
 */
export function AddVariableMenu({ onAddSimple, onAddComplex }: Readonly<AddVariableMenuProps>) {
  const {
    open,
    position,
    triggerRef,
    menuRef,
    toggle,
    close,
    registerItem,
    makeItemKeyDownHandler,
    handleTriggerKeyDown,
  } = useAddVariableMenu(1 + COMPLEX_BUILDER_CHOICES.length);

  const selectSimple = () => {
    close();
    onAddSimple();
  };

  const selectComplex = (choice: ComplexBuilderChoice) => {
    close();
    onAddComplex(choice);
  };

  // One ordered, data-driven list of every entry; the simple variable shares
  // the same row shape as the complex builders so the menu maps over a single
  // source. Grouping is derived from each entry's `group` label below.
  const options: readonly MenuOption[] = [
    {
      key: "simple",
      group: VARIABLE_GROUP.simple,
      Icon: SIMPLE_OPTION.Icon,
      label: SIMPLE_OPTION.label,
      description: SIMPLE_OPTION.description,
      onSelect: selectSimple,
    },
    ...COMPLEX_BUILDER_CHOICES.map((choice) => ({
      key: `${choice.type}-${choice.subType}`,
      group: choice.group,
      Icon: choice.Icon,
      label: choice.label,
      description: choice.description,
      onSelect: () => selectComplex(choice),
    })),
  ];

  return (
    <div className="vars-add">
      <button
        ref={triggerRef}
        type="button"
        className="vars-add__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
      >
        <AddOutlinedIcon fontSize="small" />
        <span>Add variable</span>
      </button>
      {open && position && (
        <div
          ref={menuRef}
          className="vars-add__menu"
          role="menu"
          aria-label="Add variable"
          style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
        >
          {options.map((option, index) => {
            const isNewGroup = index === 0 || option.group !== options[index - 1].group;
            return (
              <Fragment key={option.key}>
                {isNewGroup && (
                  <>
                    {index > 0 && <hr className="vars-add__divider" />}
                    <span className="vars-add__group-label">{option.group}</span>
                  </>
                )}
                <AddVariableOption
                  ref={registerItem(index)}
                  Icon={option.Icon}
                  label={option.label}
                  description={option.description}
                  onSelect={option.onSelect}
                  onKeyDown={makeItemKeyDownHandler(index)}
                />
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
import { COMPLEX_BUILDER_CHOICES, type ComplexBuilderChoice } from "../model";
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

/**
 * The "+ Add variable" control. Opens a popup where every entry — the simple
 * variable and each complex builder — is an obviously-clickable row (icon tile
 * + title + description) with hover, focus, and full keyboard navigation, so a
 * first-time user immediately sees what is selectable.
 */
export function AddVariableMenu({ onAddSimple, onAddComplex }: Readonly<AddVariableMenuProps>) {
  const itemCount = 1 + COMPLEX_BUILDER_CHOICES.length;
  const {
    open,
    triggerRef,
    menuRef,
    toggle,
    close,
    registerItem,
    makeItemKeyDownHandler,
    handleTriggerKeyDown,
  } = useAddVariableMenu(itemCount);

  const selectSimple = () => {
    close();
    onAddSimple();
  };

  const selectComplex = (choice: ComplexBuilderChoice) => {
    close();
    onAddComplex(choice);
  };

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
      {open && (
        <div ref={menuRef} className="vars-add__menu" role="menu" aria-label="Add variable">
          <AddVariableOption
            ref={registerItem(0)}
            Icon={SIMPLE_OPTION.Icon}
            label={SIMPLE_OPTION.label}
            description={SIMPLE_OPTION.description}
            onSelect={selectSimple}
            onKeyDown={makeItemKeyDownHandler(0)}
          />
          <hr className="vars-add__divider" />
          <span className="vars-add__group-label">Complex variable</span>
          {COMPLEX_BUILDER_CHOICES.map((choice, index) => (
            <AddVariableOption
              key={`${choice.type}-${choice.subType}`}
              ref={registerItem(index + 1)}
              Icon={choice.Icon}
              label={choice.label}
              description={choice.description}
              onSelect={() => selectComplex(choice)}
              onKeyDown={makeItemKeyDownHandler(index + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

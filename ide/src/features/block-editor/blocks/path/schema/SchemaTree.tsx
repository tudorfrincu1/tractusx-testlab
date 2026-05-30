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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useCallback, useState } from "react";
import type { PathSegment } from "../core/pathBuilder";
import { schemaTypeIcon, typeBadgeClass } from "./schemaIcons";

export interface SchemaNode {
  key: string;
  type: string;
  description?: string;
  children?: SchemaNode[];
  isArrayItem?: boolean;
}

export interface SchemaTreeProps {
  schema: Record<string, unknown>;
  onSelectPath: (segments: PathSegment[]) => void;
}

function schemaToNodes(schema: Record<string, unknown>): SchemaNode[] {
  const type = schema["type"] as string | undefined;

  if (type === "object") {
    const props = schema["properties"] as Record<string, Record<string, unknown>> | undefined;
    if (!props) return [];
    return Object.entries(props).map(([key, propSchema]) => buildNode(key, propSchema));
  }

  if (type === "array") {
    const items = schema["items"] as Record<string, unknown> | undefined;
    if (!items) return [];
    const itemNode = buildNode("[0]", items);
    return [{ ...itemNode, isArrayItem: true }];
  }

  return [];
}

function buildNode(key: string, schema: Record<string, unknown>): SchemaNode {
  const type = (schema["type"] as string) || "unknown";
  const description = schema["description"] as string | undefined;
  const children = schemaToNodes(schema);
  return { key, type, description, children: children.length > 0 ? children : undefined };
}

function SchemaTreeNode({
  node,
  path,
  onSelect,
  selectedPath,
  depth,
}: Readonly<{
  node: SchemaNode;
  path: PathSegment[];
  onSelect: (segments: PathSegment[]) => void;
  selectedPath: string;
  depth: number;
}>) {
  const [expanded, setExpanded] = useState(depth < 2);

  const currentPath: PathSegment[] = [
    ...path,
    { type: node.isArrayItem ? "index" : "key", value: node.isArrayItem ? "0" : node.key },
  ];

  const pathStr = currentPath.map((s) => s.value).join(".");
  const isLeaf = !node.children || node.children.length === 0;
  const isExpandable = !isLeaf;
  const isSelected = pathStr === selectedPath;

  const handleClick = useCallback(() => {
    onSelect(currentPath);
    if (isExpandable) setExpanded((prev) => !prev);
  }, [isExpandable, onSelect, currentPath]);

  const badgeLabel = node.type === "array" ? "array" : node.type;

  return (
    <div className="schema-tree-node">
      <div
        className={`schema-tree-row${isLeaf ? " schema-tree-leaf" : ""}${isSelected ? " schema-tree-selected" : ""} schema-tree-depth-${Math.min(depth, 6)}`}
        role="treeitem"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
        title={node.description || `${node.key} (${node.type})`}
      >
        {isExpandable && (
          <span className={`schema-tree-toggle${expanded ? "" : " schema-tree-toggle-collapsed"}`}>▾</span>
        )}
        {!isExpandable && <span className="schema-tree-toggle-spacer" />}
        <span className="schema-tree-icon">{schemaTypeIcon(node.type)}</span>
        <span className="schema-tree-key">{node.key}</span>
        <span className={`schema-tree-badge ${typeBadgeClass(node.type)}`}>{badgeLabel}</span>
      </div>
      {isExpandable && expanded && node.children?.map((child) => (
        <SchemaTreeNode
          key={child.key}
          node={child}
          path={currentPath}
          onSelect={onSelect}
          selectedPath={selectedPath}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function SchemaTree({ schema, onSelectPath }: Readonly<SchemaTreeProps>) {
  const nodes = schemaToNodes(schema);
  const [selectedPath, setSelectedPath] = useState("");

  const handleSelect = useCallback((segments: PathSegment[]) => {
    const pathStr = segments.map((s) => s.value).join(".");
    setSelectedPath(pathStr);
    onSelectPath(segments);
  }, [onSelectPath]);

  if (nodes.length === 0) {
    return <div className="schema-tree-empty">No schema structure available</div>;
  }

  return (
    <div className="schema-tree">
      <div className="schema-tree-content" role="tree">
        {nodes.map((node) => (
          <SchemaTreeNode
            key={node.key}
            node={node}
            path={[]}
            onSelect={handleSelect}
            selectedPath={selectedPath}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

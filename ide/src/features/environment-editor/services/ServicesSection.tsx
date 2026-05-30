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

import { useState, useCallback } from "react";
import { useServiceStore } from "@/store";
import type { ServiceDefinition } from "@/models/schema";
import { ServiceCard } from "./ServiceCard";

export function ServicesSection() {
  const services = useServiceStore((s) => s.services);
  const addService = useServiceStore((s) => s.addService);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAddService = useCallback(() => {
    const newService: ServiceDefinition = {
      name: `service_${services.length + 1}`,
      uses: "service/connector_service",
      with: {},
    };
    addService(newService);
  }, [services.length, addService]);

  return (
    <div className="section">
      <div className="section-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{isCollapsed ? "▶" : "▼"} Services</span>
        <span className="count-badge">{services.length}</span>
      </div>

      {!isCollapsed && (
        <div className="services-list">
          {services.length === 0 && (
            <p className="additional-hint">No services configured. Import a YAML or add one manually.</p>
          )}
          {services.map((svc) => (
            <ServiceCard key={svc.name} service={svc} />
          ))}
          <button type="button" className="add-btn" onClick={handleAddService}>
            + Add Service
          </button>
        </div>
      )}
    </div>
  );
}

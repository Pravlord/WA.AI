import { useEffect } from "react";
import type { ReactNode } from "react";
import type { MainBlockGroup, MainBlockLayout, MainBlockTab } from "../../../../shared/appShell";

type MainBlockComposerProps = {
  layout: MainBlockLayout;
  onChangeLayout: (layout: MainBlockLayout) => void;
  renderTab: (tab: MainBlockTab) => ReactNode;
};

export function MainBlockComposer({ layout, onChangeLayout, renderTab }: MainBlockComposerProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      if (event.key === "\\") {
        event.preventDefault();
        splitActiveGroup("horizontal");
      }

      if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        closeActiveTab();
      }

      if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        focusNextGroup();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const template =
    layout.orientation === "vertical"
      ? `repeat(${layout.groups.length}, minmax(0, 1fr))`
      : `repeat(${layout.groups.length}, minmax(0, 1fr))`;

  return (
    <section
      className={`main-block-composer orientation-${layout.orientation}`}
      style={
        layout.orientation === "vertical"
          ? { gridTemplateRows: template }
          : { gridTemplateColumns: template }
      }
    >
      {layout.groups.map((group) => (
        <EditorGroupView
          group={group}
          isActive={group.id === layout.activeGroupId}
          key={group.id}
          onActivateGroup={() => setActiveGroup(group.id)}
          onCloseTab={(tabId) => closeTab(group.id, tabId)}
          onDockTab={(tabId, direction) => dockTab(group.id, tabId, direction)}
          onMoveTab={(tabId, targetGroupId) => moveTab(group.id, tabId, targetGroupId)}
          onReorderTab={(tabId, targetTabId) => reorderTab(group.id, tabId, targetTabId)}
          onSelectTab={(tabId) => updateGroup(group.id, { activeTabId: tabId })}
          onSplitGroup={(orientation) => splitGroup(group.id, orientation)}
          renderTab={renderTab}
        />
      ))}
    </section>
  );

  function setActiveGroup(groupId: string) {
    onChangeLayout({
      ...layout,
      activeGroupId: groupId
    });
  }

  function updateGroup(groupId: string, patch: Partial<MainBlockGroup>) {
    onChangeLayout({
      ...layout,
      activeGroupId: groupId,
      groups: layout.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group))
    });
  }

  function closeActiveTab() {
    const group = layout.groups.find((candidate) => candidate.id === layout.activeGroupId);
    if (group?.activeTabId) {
      closeTab(group.id, group.activeTabId);
    }
  }

  function closeTab(groupId: string, tabId: string) {
    const nextGroups = layout.groups
      .map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const tabs = group.tabs.filter((tab) => tab.id !== tabId);
        return {
          ...group,
          tabs,
          activeTabId: group.activeTabId === tabId ? tabs[0]?.id ?? null : group.activeTabId
        };
      })
      .filter((group) => group.tabs.length > 0 || layout.groups.length === 1);

    onChangeLayout({
      ...layout,
      groups: nextGroups,
      activeGroupId: nextGroups.some((group) => group.id === layout.activeGroupId)
        ? layout.activeGroupId
        : nextGroups[0]?.id ?? layout.activeGroupId
    });
  }

  function splitActiveGroup(orientation: MainBlockLayout["orientation"]) {
    splitGroup(layout.activeGroupId, orientation);
  }

  function splitGroup(groupId: string, orientation: MainBlockLayout["orientation"]) {
    const group = layout.groups.find((candidate) => candidate.id === groupId);
    const activeTab = group?.tabs.find((tab) => tab.id === group.activeTabId) ?? group?.tabs[0];
    const newGroup: MainBlockGroup = {
      id: crypto.randomUUID(),
      tabs: activeTab ? [activeTab] : [],
      activeTabId: activeTab?.id ?? null
    };

    onChangeLayout({
      ...layout,
      orientation,
      groups: [...layout.groups, newGroup],
      activeGroupId: newGroup.id
    });
  }

  function focusNextGroup() {
    const index = layout.groups.findIndex((group) => group.id === layout.activeGroupId);
    const nextGroup = layout.groups[(index + 1) % layout.groups.length];

    if (nextGroup) {
      setActiveGroup(nextGroup.id);
    }
  }

  function reorderTab(groupId: string, tabId: string, targetTabId: string) {
    const group = layout.groups.find((candidate) => candidate.id === groupId);
    if (!group || tabId === targetTabId) {
      return;
    }

    const tab = group.tabs.find((candidate) => candidate.id === tabId);
    if (!tab) {
      return;
    }

    const withoutTab = group.tabs.filter((candidate) => candidate.id !== tabId);
    const targetIndex = withoutTab.findIndex((candidate) => candidate.id === targetTabId);
    const tabs = [...withoutTab.slice(0, targetIndex), tab, ...withoutTab.slice(targetIndex)];
    updateGroup(groupId, { tabs, activeTabId: tabId });
  }

  function moveTab(sourceGroupId: string, tabId: string, targetGroupId: string) {
    if (sourceGroupId === targetGroupId) {
      return;
    }

    const sourceGroup = layout.groups.find((group) => group.id === sourceGroupId);
    const tab = sourceGroup?.tabs.find((candidate) => candidate.id === tabId);

    if (!sourceGroup || !tab) {
      return;
    }

    const groups = layout.groups.map((group) => {
      if (group.id === sourceGroupId) {
        const tabs = group.tabs.filter((candidate) => candidate.id !== tabId);
        return {
          ...group,
          tabs,
          activeTabId: group.activeTabId === tabId ? tabs[0]?.id ?? null : group.activeTabId
        };
      }

      if (group.id === targetGroupId && !group.tabs.some((candidate) => candidate.id === tabId)) {
        return {
          ...group,
          tabs: [...group.tabs, tab],
          activeTabId: tab.id
        };
      }

      return group;
    });

    onChangeLayout({
      ...layout,
      groups: groups.filter((group) => group.tabs.length > 0 || group.id === targetGroupId),
      activeGroupId: targetGroupId
    });
  }

  function dockTab(sourceGroupId: string, tabId: string, orientation: MainBlockLayout["orientation"]) {
    const sourceGroup = layout.groups.find((group) => group.id === sourceGroupId);
    const tab = sourceGroup?.tabs.find((candidate) => candidate.id === tabId);

    if (!sourceGroup || !tab) {
      return;
    }

    const newGroup: MainBlockGroup = {
      id: crypto.randomUUID(),
      tabs: [tab],
      activeTabId: tab.id
    };
    const sourceTabs = sourceGroup.tabs.filter((candidate) => candidate.id !== tabId);

    onChangeLayout({
      ...layout,
      orientation,
      groups: [
        ...layout.groups
          .map((group) =>
            group.id === sourceGroupId
              ? {
                  ...group,
                  tabs: sourceTabs,
                  activeTabId: sourceGroup.activeTabId === tabId ? sourceTabs[0]?.id ?? null : sourceGroup.activeTabId
                }
              : group
          )
          .filter((group) => group.tabs.length > 0),
        newGroup
      ],
      activeGroupId: newGroup.id
    });
  }
}

type EditorGroupViewProps = {
  group: MainBlockGroup;
  isActive: boolean;
  onActivateGroup: () => void;
  onCloseTab: (tabId: string) => void;
  onDockTab: (tabId: string, orientation: MainBlockLayout["orientation"]) => void;
  onMoveTab: (tabId: string, targetGroupId: string) => void;
  onReorderTab: (tabId: string, targetTabId: string) => void;
  onSelectTab: (tabId: string) => void;
  onSplitGroup: (orientation: MainBlockLayout["orientation"]) => void;
  renderTab: (tab: MainBlockTab) => ReactNode;
};

function EditorGroupView({
  group,
  isActive,
  onActivateGroup,
  onCloseTab,
  onDockTab,
  onMoveTab,
  onReorderTab,
  onSelectTab,
  onSplitGroup,
  renderTab
}: EditorGroupViewProps) {
  const activeTab = group.tabs.find((tab) => tab.id === group.activeTabId) ?? group.tabs[0] ?? null;

  return (
    <section
      className={`editor-group ${isActive ? "active" : ""}`}
      onClick={onActivateGroup}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const tabId = event.dataTransfer.getData("application/x-wa-tab");
        const sourceGroupId = event.dataTransfer.getData("application/x-wa-group");
        if (tabId && sourceGroupId) {
          onMoveTab(tabId, group.id);
        }
      }}
    >
      <nav className="editor-tabs" aria-label="Open items">
        {group.tabs.length === 0 ? (
          <span className="editor-tab-placeholder">No item open</span>
        ) : (
          group.tabs.map((tab) => (
            <div
              className={`editor-tab ${tab.id === activeTab?.id ? "active" : ""}`}
              draggable
              key={tab.id}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-wa-tab", tab.id);
                event.dataTransfer.setData("application/x-wa-group", group.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const tabId = event.dataTransfer.getData("application/x-wa-tab");
                const sourceGroupId = event.dataTransfer.getData("application/x-wa-group");
                if (tabId && sourceGroupId === group.id) {
                  onReorderTab(tabId, tab.id);
                }
              }}
            >
              <button type="button" onClick={() => onSelectTab(tab.id)}>
                {tab.title}
              </button>
              <button
                className="tab-close"
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                x
              </button>
            </div>
          ))
        )}
        <div className="editor-group-actions">
          <button type="button" title="Split right" onClick={() => onSplitGroup("horizontal")}>
            SR
          </button>
          <button type="button" title="Split down" onClick={() => onSplitGroup("vertical")}>
            SD
          </button>
        </div>
      </nav>
      <div className="dock-zones" aria-hidden="true">
        <button
          type="button"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const tabId = event.dataTransfer.getData("application/x-wa-tab");
            if (tabId) {
              onDockTab(tabId, "horizontal");
            }
          }}
        >
          Dock right
        </button>
        <button
          type="button"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const tabId = event.dataTransfer.getData("application/x-wa-tab");
            if (tabId) {
              onDockTab(tabId, "vertical");
            }
          }}
        >
          Dock down
        </button>
      </div>
      <div className="editor-surface">{activeTab ? renderTab(activeTab) : null}</div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTasbihStore } from "../../store/tasbihStore";
import { dhikrs } from "../../data/dhikrs";
import { BottomNav } from "../../components/BottomNav";
import { Modal } from "../../components/Modal";

function groupByCategory(items: typeof dhikrs) {
  const map = new Map<string, typeof dhikrs>();
  items.forEach((d) => {
    const list = map.get(d.category) ?? [];
    list.push(d);
    map.set(d.category, list);
  });
  return map;
}

export default function ListesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const customLists = useTasbihStore((s) => s.customLists);
  const createList = useTasbihStore((s) => s.createList);
  const deleteList = useTasbihStore((s) => s.deleteList);
  const renameList = useTasbihStore((s) => s.renameList);
  const removeFromList = useTasbihStore((s) => s.removeFromList);
  const moveInList = useTasbihStore((s) => s.moveInList);
  const selectList = useTasbihStore((s) => s.selectList);
  const activeListId = useTasbihStore((s) => s.activeListId);

  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({});
  const [dragging, setDragging] = useState<{ listId: string; index: number } | null>(null);

  const [modalType, setModalType] = useState<"create" | "rename" | "delete" | null>(null);
  const [modalListId, setModalListId] = useState<string | null>(null);
  const [modalInput, setModalInput] = useState<string>("");

  const filteredDhikrs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dhikrs;
    return dhikrs.filter((d) => {
      return (
        d.arabic.includes(query) ||
        d.transliteration.toLowerCase().includes(query) ||
        d.translation_fr.toLowerCase().includes(query) ||
        d.translation_en.toLowerCase().includes(query)
      );
    });
  }, [search]);

  const categories = useMemo(() => groupByCategory(filteredDhikrs), [filteredDhikrs]);

  const closeModal = () => {
    setModalType(null);
    setModalListId(null);
    setModalInput("");
  };

  const openCreateModal = () => {
    setModalType("create");
    setModalInput("");
  };

  const openRenameModal = (listId: string) => {
    setModalType("rename");
    setModalListId(listId);
    setModalInput(listId);
  };

  const openDeleteModal = (listId: string) => {
    setModalType("delete");
    setModalListId(listId);
  };

  const handleCreateConfirm = () => {
    const name = modalInput.trim();
    if (!name) return;
    createList(name);
    setExpandedLists((prev) => ({ ...prev, [name]: true }));
    closeModal();
  };

  const handleRenameConfirm = () => {
    if (!modalListId) return;
    const name = modalInput.trim();
    if (!name) return;
    renameList(modalListId, name);
    closeModal();
  };

  const handleDeleteConfirm = () => {
    if (!modalListId) return;
    deleteList(modalListId);
    closeModal();
  };

  const handleDrop = (listId: string, toIndex: number) => {
    if (!dragging) return;
    if (dragging.listId !== listId) return;
    moveInList(listId, dragging.index, toIndex);
    setDragging(null);
  };

  if (!mounted) return null;

  const isSearching = search.trim().length > 0;
  const categoryEntries = Array.from(categories.entries());

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <motion.main
        className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-white">📚 Listes</h1>
          <p className="text-sm text-gray-400">Bibliothèque, listes personnalisées et organisation</p>
        </header>

        <section className="overflow-hidden rounded-3xl border border-[#2A2A2A] bg-gradient-to-b from-[#171717] to-[#121212]">
          <button
            type="button"
            onClick={() => setLibraryExpanded((prev) => !prev)}
            aria-expanded={libraryExpanded}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl text-[#F5A623]">◫</span>
              <div>
                <div className="text-[1.05rem] font-semibold text-white">
                  Bibliothèque de zikr
                  <span className="ml-2 text-gray-500">({dhikrs.length})</span>
                </div>
              </div>
            </div>
            <span className="text-2xl text-gray-500">{libraryExpanded ? "⌃" : "⌄"}</span>
          </button>

          {libraryExpanded && (
            <div className="border-t border-[#242424]">
              <div className="px-4 py-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={(e) => setSearch(e.target.value.trim())}
                  placeholder="Rechercher un zikr..."
                  className="w-full rounded-2xl border border-[#3A3A3A] bg-[#202020] px-4 py-3 text-base text-white placeholder:text-gray-500 outline-none focus:border-[#F5A623]"
                />
              </div>

              <div className="max-h-[40vh] overflow-y-auto overscroll-contain border-t border-[#242424]">
                {categoryEntries.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400">Aucun résultat trouvé</div>
                ) : (
                  categoryEntries.map(([category, items]) => {
                    const expanded = isSearching ? true : expandedCategories[category] ?? false;
                    return (
                      <div key={category} className="border-b border-[#242424] last:border-b-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [category]: !expanded,
                            }))
                          }
                          aria-expanded={expanded}
                          className="flex w-full items-center justify-between px-5 py-3 text-left"
                        >
                          <span className="text-lg leading-none text-[#F5A623]">•</span>
                          <span className="ml-2 flex-1 text-[1.15rem] font-semibold text-[#F5A623]">
                            {category}
                          </span>
                          <span className="text-lg font-semibold text-[#6C6C6C]">{items.length}</span>
                          <span className="ml-3 text-base text-[#5A5A5A]">{expanded ? "⌄" : "›"}</span>
                        </button>

                        {expanded && (
                          <div className="space-y-1 px-5 pb-4">
                            {items.map((d) => (
                              <div
                                key={d.id}
                                className="rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2"
                              >
                                <div className="text-sm font-semibold text-white">{d.arabic}</div>
                                <div className="text-xs text-gray-400">
                                  {d.transliteration} · {d.defaultTarget}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Listes personnalisées</div>
              <div className="text-xs text-gray-400">Créer, modifier, organiser</div>
            </div>
            <button
              onClick={openCreateModal}
              className="rounded-xl bg-[#F5A623] px-3 py-2 text-xs font-semibold text-black"
            >
              + Nouvelle liste
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {Object.keys(customLists).length === 0 ? (
              <div className="text-sm text-gray-400">Aucune liste personnelle. Créez-en une.</div>
            ) : (
              Object.entries(customLists).map(([listId, items]) => {
                const expanded = expandedLists[listId] ?? false;
                const isActive = activeListId === listId;
                return (
                  <div
                    key={listId}
                    className={`rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] ${
                      isActive ? "ring-2 ring-[#F5A623]/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <button
                          onClick={() => selectList(listId)}
                          className="text-sm font-semibold text-white"
                        >
                          {listId}
                        </button>
                        <div className="text-xs text-gray-400">{items.length} zikrs</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openRenameModal(listId)}
                          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1 text-xs text-white"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => openDeleteModal(listId)}
                          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1 text-xs text-white"
                        >
                          🗑
                        </button>
                        <button
                          onClick={() =>
                            setExpandedLists((prev) => ({
                              ...prev,
                              [listId]: !expanded,
                            }))
                          }
                          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1 text-xs text-white"
                        >
                          {expanded ? "–" : "+"}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-2 px-4 pb-3">
                        {items.length === 0 ? (
                          <div className="text-sm text-gray-400">Aucun Zikr dans cette liste.</div>
                        ) : (
                          items.map((dhikrId, index) => {
                            const dhikr = dhikrs.find((d) => d.id === dhikrId);
                            if (!dhikr) return null;
                            return (
                              <div
                                key={dhikrId}
                                draggable
                                onDragStart={(e) => {
                                  setDragging({ listId, index });
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                }}
                                onDrop={() => handleDrop(listId, index)}
                                className="flex items-center justify-between rounded-xl bg-[#1A1A1A] px-3 py-2"
                              >
                                <div>
                                  <div className="text-sm text-white">{dhikr.arabic}</div>
                                  <div className="text-xs text-gray-400">{dhikr.transliteration}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => removeFromList(listId, dhikrId)}
                                    className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-1 text-xs text-white"
                                  >
                                    –
                                  </button>
                                  <span className="text-xs text-gray-400">☰</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <Modal
          isOpen={modalType === "create"}
          title="Nouvelle liste"
          onClose={closeModal}
          closeOnOverlayClick
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateConfirm}
                className="rounded-xl bg-[#F5A623] px-4 py-2 text-sm font-semibold text-black"
              >
                Créer
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-200">Nom de la liste</label>
            <input
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder="Mon programme du matin"
              className="w-full rounded-xl bg-[#2A2A2A] px-4 py-2 text-sm text-white outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
            />
          </div>
        </Modal>

        <Modal
          isOpen={modalType === "rename"}
          title="Renommer la liste"
          onClose={closeModal}
          closeOnOverlayClick
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleRenameConfirm}
                className="rounded-xl bg-[#F5A623] px-4 py-2 text-sm font-semibold text-black"
              >
                Renommer
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-200">Nouveau nom</label>
            <input
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              className="w-full rounded-xl bg-[#2A2A2A] px-4 py-2 text-sm text-white outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
            />
          </div>
        </Modal>

        <Modal
          isOpen={modalType === "delete"}
          title="Supprimer la liste"
          onClose={closeModal}
          closeOnOverlayClick
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white"
              >
                Supprimer
              </button>
            </div>
          }
        >
          <div className="text-sm text-gray-200">
            Supprimer <span className="font-semibold text-white">{modalListId}</span> ?
          </div>
        </Modal>

      </motion.main>
      <BottomNav />
    </div>
  );
}

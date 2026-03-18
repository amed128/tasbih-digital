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
  const addToList = useTasbihStore((s) => s.addToList);
  const removeFromList = useTasbihStore((s) => s.removeFromList);
  const moveInList = useTasbihStore((s) => s.moveInList);
  const selectList = useTasbihStore((s) => s.selectList);
  const activeListId = useTasbihStore((s) => s.activeListId);
  const activeList = useTasbihStore((s) => s.activeList);

  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({});
  const [dragging, setDragging] = useState<{ listId: string; index: number } | null>(null);

  const [modalType, setModalType] = useState<"create" | "rename" | "delete" | "add" | null>(null);
  const [modalListId, setModalListId] = useState<string | null>(null);
  const [modalInput, setModalInput] = useState<string>("");
  const [modalSearch, setModalSearch] = useState("");

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

  const modalFilteredDhikrs = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    if (!q) return dhikrs;
    return dhikrs.filter((d) => {
      return (
        d.arabic.includes(q) ||
        d.transliteration.toLowerCase().includes(q) ||
        d.translation_fr.toLowerCase().includes(q) ||
        d.translation_en.toLowerCase().includes(q)
      );
    });
  }, [modalSearch]);

  const closeModal = () => {
    setModalType(null);
    setModalListId(null);
    setModalInput("");
    setModalSearch("");
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

  const openAddDhikrModal = (listId: string) => {
    setModalType("add");
    setModalListId(listId);
    setModalSearch("");
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

  const handleAddDhikr = (dhikrId: string) => {
    if (!modalListId) return;
    addToList(modalListId, dhikrId);
    closeModal();
  };

  const handleDrop = (listId: string, toIndex: number) => {
    if (!dragging) return;
    if (dragging.listId !== listId) return;
    moveInList(listId, dragging.index, toIndex);
    setDragging(null);
  };

  if (!mounted) return null;

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

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Bibliothèque de zikr (70)</div>
              <div className="text-xs text-gray-400">Recherche et exploration</div>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-36 rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-white outline-none focus:border-[#F5A623]"
            />
          </div>

          <div className="mt-4 space-y-3">
            {Array.from(categories.entries()).map(([category, items]) => {
              const expanded = expandedCategories[category] ?? true;
              return (
                <div key={category} className="rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A]">
                  <button
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category]: !expanded,
                      }))
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="font-semibold text-white">{category}</span>
                    <span className="text-sm font-semibold text-[#F5A623]">
                      {expanded ? "–" : "+"}
                    </span>
                  </button>
                  {expanded && (
                    <div className="space-y-1 px-4 pb-3">
                      {items.map((d) => (
                        <div
                          key={d.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#1A1A1A] px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{d.arabic}</span>
                            <span className="text-xs text-gray-400">
                              {d.transliteration} ×{d.defaultTarget}
                            </span>
                          </div>
                          <button
                            onClick={() => openAddDhikrModal(activeListId)}
                            className="rounded-lg bg-[#F5A623] px-3 py-1 text-xs font-semibold text-black"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

        <Modal
          isOpen={modalType === "add"}
          title="Ajouter un Zikr"
          onClose={closeModal}
          closeOnOverlayClick
          footer={
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
              >
                Fermer
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <input
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Rechercher un Zikr..."
              className="w-full rounded-xl bg-[#2A2A2A] px-4 py-2 text-sm text-white outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/40"
            />
            <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
              {modalFilteredDhikrs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleAddDhikr(d.id)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#1A1A1A] px-3 py-2 text-left text-white transition hover:bg-[#2A2A2A]"
                >
                  <div>
                    <div className="text-sm text-[#F5A623]">{d.arabic}</div>
                    <div className="text-xs text-gray-400">{d.transliteration}</div>
                  </div>
                  <div className="text-xs font-semibold text-white">Ajouter</div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      </motion.main>
      <BottomNav />
    </div>
  );
}

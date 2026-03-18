"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Grip, Pencil, Search, Trash2 } from "lucide-react";
import { useTasbihStore } from "../../store/tasbihStore";
import { dhikrs } from "../../data/dhikrs";
import type { Dhikr } from "../../data/dhikrs";
import { BottomNav } from "../../components/BottomNav";
import { Modal } from "../../components/Modal";

type CreateListItem = {
  source: "library" | "manual";
  dhikr: Dhikr;
};

type DhikrAutocompleteSuggestion = {
  arabic: string;
  transliteration: string;
};

const COMMON_TRANSLITERATION_MAP: Record<string, DhikrAutocompleteSuggestion> = {
  subhanallah: {
    arabic: "سُبْحَانَ اللهِ",
    transliteration: "Subhanallah",
  },
  alhamdulillah: {
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
  },
  allahuakbar: {
    arabic: "اللهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
  },
  laailahaillallah: {
    arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
    transliteration: "Laa ilaaha illallah",
  },
  lailahaillallah: {
    arabic: "لَا إِلٰهَ إِلَّا اللَّهُ",
    transliteration: "Laa ilaaha illallah",
  },
  astaghfirullah: {
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
  },
  hasbunallahwanimalwakeel: {
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "Hasbunallahu wa ni'mal wakeel",
  },
  lahawlawalaquwwataillabillah: {
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "La hawla wa la quwwata illa billah",
  },
  salallahu3alayhiwasallam: {
    arabic: "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
    transliteration: "Sallallahu alayhi wa sallam",
  },
  salallahualayhiwasallam: {
    arabic: "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
    transliteration: "Sallallahu alayhi wa sallam",
  },
};

function normalizeTransliteration(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getAutocompleteSuggestion(value: string): DhikrAutocompleteSuggestion | null {
  const normalized = normalizeTransliteration(value);

  if (!normalized) return null;

  if (COMMON_TRANSLITERATION_MAP[normalized]) {
    return COMMON_TRANSLITERATION_MAP[normalized];
  }

  const exactMatch = dhikrs.find(
    (dhikr) => normalizeTransliteration(dhikr.transliteration) === normalized
  );
  if (exactMatch) {
    return {
      arabic: exactMatch.arabic,
      transliteration: exactMatch.transliteration,
    };
  }

  const closeMatch = dhikrs.find((dhikr) => {
    const transliteration = normalizeTransliteration(dhikr.transliteration);
    return transliteration.startsWith(normalized) || normalized.startsWith(transliteration);
  });

  if (!closeMatch) return null;

  return {
    arabic: closeMatch.arabic,
    transliteration: closeMatch.transliteration,
  };
}

function groupByCategory(items: typeof dhikrs) {
  const map = new Map<string, typeof dhikrs>();
  items.forEach((d) => {
    const list = map.get(d.category) ?? [];
    list.push(d);
    map.set(d.category, list);
  });
  return map;
}

function formatZikrCount(count: number) {
  return `${count} ${count === 1 ? "zikr" : "zikrs"}`;
}

export default function ListesPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const customLists = useTasbihStore((s) => s.customLists);
  const customDhikrs = useTasbihStore((s) => s.customDhikrs);
  const createList = useTasbihStore((s) => s.createList);
  const deleteList = useTasbihStore((s) => s.deleteList);
  const renameList = useTasbihStore((s) => s.renameList);
  const upsertCustomDhikr = useTasbihStore((s) => s.upsertCustomDhikr);
  const addToList = useTasbihStore((s) => s.addToList);
  const removeFromList = useTasbihStore((s) => s.removeFromList);
  const selectList = useTasbihStore((s) => s.selectList);
  const activeListId = useTasbihStore((s) => s.activeListId);
  const listesUI = useTasbihStore((s) => s.listesUI);
  const setListesUI = useTasbihStore((s) => s.setListesUI);

  const libraryExpanded = listesUI.libraryExpanded;
  const expandedCategories = listesUI.expandedCategories;
  const expandedLists = listesUI.expandedLists;

  const setLibraryExpanded = (val: boolean | ((prev: boolean) => boolean)) =>
    setListesUI({ libraryExpanded: typeof val === "function" ? val(listesUI.libraryExpanded) : val });
  const setExpandedCategories = (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) =>
    setListesUI({ expandedCategories: typeof val === "function" ? val(listesUI.expandedCategories) : val });
  const setExpandedLists = (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) =>
    setListesUI({ expandedLists: typeof val === "function" ? val(listesUI.expandedLists) : val });

  const [search, setSearch] = useState("");

  const [modalType, setModalType] = useState<"create" | "edit" | "delete" | null>(null);
  const [modalListId, setModalListId] = useState<string | null>(null);
  const [modalInput, setModalInput] = useState<string>("");
  const [createLibraryExpanded, setCreateLibraryExpanded] = useState(false);
  const [createSearchQuery, setCreateSearchQuery] = useState("");
  const [createListItems, setCreateListItems] = useState<CreateListItem[]>([]);
  const [manualDhikrShow, setManualDhikrShow] = useState(false);
  const [manualArabic, setManualArabic] = useState("");
  const [manualTranslit, setManualTranslit] = useState("");
  const [manualReps, setManualReps] = useState("33");
  const [createCategoryExpanded, setCreateCategoryExpanded] = useState<Record<string, boolean>>({});
  const [selectedLibraryDhikr, setSelectedLibraryDhikr] = useState<Dhikr | null>(null);

  const allDhikrsById = useMemo(() => {
    const entries = [...dhikrs, ...Object.values(customDhikrs)].map((dhikr) => [dhikr.id, dhikr] as const);
    return new Map<string, Dhikr>(entries);
  }, [customDhikrs]);

  const manualAutocompleteSuggestion = useMemo(
    () => getAutocompleteSuggestion(manualTranslit.trim()),
    [manualTranslit]
  );

  const manualArabicSuggestion = useMemo(() => {
    if (manualArabic.trim()) return "";
    return manualAutocompleteSuggestion?.arabic ?? "";
  }, [manualArabic, manualAutocompleteSuggestion]);

  const parsedManualReps = Number.parseInt(manualReps.trim(), 10);
  const isManualRepsValid = Number.isFinite(parsedManualReps) && parsedManualReps > 0;
  const hasManualLabel = Boolean(manualArabic.trim() || manualTranslit.trim());
  const canAddManualDhikr = hasManualLabel && isManualRepsValid;
  const isListFormMode = modalType === "create" || modalType === "edit";
  const isEditMode = modalType === "edit";
  const trimmedListName = modalInput.trim();
  const hasDuplicateListName =
    trimmedListName.length > 0 &&
    Object.keys(customLists).some(
      (listId) => listId === trimmedListName && (!isEditMode || listId !== modalListId)
    );
  const canSaveList =
    trimmedListName.length > 0 && createListItems.length > 0 && !hasDuplicateListName;

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
    setCreateListItems([]);
    setManualDhikrShow(false);
    setManualArabic("");
    setManualTranslit("");
    setManualReps("33");
    setCreateLibraryExpanded(false);
    setCreateSearchQuery("");
    setCreateCategoryExpanded({});
  };

  const openCreateModal = () => {
    setModalType("create");
    setModalInput("");
    setCreateListItems([]);
    setManualDhikrShow(false);
    setManualArabic("");
    setManualTranslit("");
    setManualReps("33");
    setCreateLibraryExpanded(false);
    setCreateSearchQuery("");
    setCreateCategoryExpanded({});
  };

  const createFilteredDhikrs = useMemo(() => {
    const query = createSearchQuery.trim().toLowerCase();
    if (!query) return dhikrs;
    return dhikrs.filter((d) => {
      return (
        d.arabic.includes(query) ||
        d.transliteration.toLowerCase().includes(query) ||
        d.translation_fr.toLowerCase().includes(query) ||
        d.translation_en.toLowerCase().includes(query)
      );
    });
  }, [createSearchQuery]);

  const createCategories = useMemo(() => groupByCategory(createFilteredDhikrs), [createFilteredDhikrs]);

  const handleAddDhikrToCreate = (dhikrId: string) => {
    const dhikr = dhikrs.find((item) => item.id === dhikrId);
    if (!dhikr) return;

    setCreateListItems((prev) => {
      if (prev.some((item) => item.dhikr.id === dhikrId)) return prev;
      return [...prev, { source: "library", dhikr }];
    });
  };

  const handleRemoveDhikrFromCreate = (dhikrId: string) => {
    setCreateListItems((prev) => prev.filter((item) => item.dhikr.id !== dhikrId));
  };

  const handleAddManualDhikr = () => {
    const transliteration = manualTranslit.trim();
    const autocompleteSuggestion = getAutocompleteSuggestion(transliteration);
    const arabic = manualArabic.trim() || autocompleteSuggestion?.arabic || transliteration;
    const repetitions = Number.parseInt(manualReps.trim(), 10);

    if (!canAddManualDhikr) return;

    const manualDhikr: Dhikr = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      arabic,
      transliteration: autocompleteSuggestion?.transliteration || transliteration || manualArabic.trim(),
      translation_fr: autocompleteSuggestion?.transliteration || transliteration || manualArabic.trim(),
      translation_en: autocompleteSuggestion?.transliteration || transliteration || manualArabic.trim(),
      defaultTarget: repetitions,
      category: "Dhikr général",
    };

    setCreateListItems((prev) => [...prev, { source: "manual", dhikr: manualDhikr }]);
    setManualArabic("");
    setManualTranslit("");
    setManualReps("33");
    setManualDhikrShow(false);
  };

  const handleManualTranslitBlur = () => {
    if (!manualTranslit.trim()) return;

    const autocompleteSuggestion = getAutocompleteSuggestion(manualTranslit.trim());
    if (autocompleteSuggestion) {
      setManualArabic((prev) => prev.trim() || autocompleteSuggestion.arabic);
      setManualTranslit(autocompleteSuggestion.transliteration);
    }
  };

  const openEditListView = (listId: string) => {
    const baseItems = (customLists[listId] ?? [])
      .map((dhikrId) => {
        const dhikr = allDhikrsById.get(dhikrId);
        if (!dhikr) return null;
        return {
          source: customDhikrs[dhikrId] ? "manual" : "library",
          dhikr,
        } as CreateListItem;
      })
      .filter((item): item is CreateListItem => item !== null);

    setModalType("edit");
    setModalListId(listId);
    setModalInput(listId);
    setCreateListItems(baseItems);
    setManualDhikrShow(false);
    setManualArabic("");
    setManualTranslit("");
    setManualReps("33");
    setCreateLibraryExpanded(false);
    setCreateSearchQuery("");
    setCreateCategoryExpanded({});
  };

  const openDeleteModal = (listId: string) => {
    setModalType("delete");
    setModalListId(listId);
  };

  const handleSaveListForm = () => {
    const name = modalInput.trim();
    if (!name || createListItems.length === 0 || hasDuplicateListName) return;

    if (modalType === "create") {
      createList(name);
      createListItems.forEach(({ source, dhikr }) => {
        if (source === "manual") {
          upsertCustomDhikr(dhikr);
        }
        addToList(name, dhikr.id);
      });
      setExpandedLists((prev) => ({ ...prev, [name]: true }));
      closeModal();
      return;
    }

    if (modalType === "edit" && modalListId) {
      const originalListId = modalListId;
      const currentIds = customLists[originalListId] ?? [];

      createListItems.forEach(({ source, dhikr }) => {
        if (source === "manual") {
          upsertCustomDhikr(dhikr);
        }
      });

      const targetListId = name;
      if (targetListId !== originalListId) {
        renameList(originalListId, targetListId);
      }

      const desiredIds = createListItems.map((item) => item.dhikr.id);
      const desiredSet = new Set(desiredIds);
      const existingSet = new Set(currentIds);

      currentIds.forEach((dhikrId) => {
        if (!desiredSet.has(dhikrId)) {
          removeFromList(targetListId, dhikrId);
        }
      });

      desiredIds.forEach((dhikrId) => {
        if (!existingSet.has(dhikrId)) {
          addToList(targetListId, dhikrId);
        }
      });

      setExpandedLists((prev) => ({ ...prev, [targetListId]: true }));
      closeModal();
    }
  };

  const handleDeleteConfirm = () => {
    if (!modalListId) return;
    deleteList(modalListId);
    closeModal();
  };

  if (!mounted) return null;

  const isSearching = search.trim().length > 0;
  const categoryEntries = Array.from(categories.entries());

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-white">
      <div className="border-b border-[#242424]">
        <div className="mx-auto flex h-18 w-full max-w-md items-center justify-center gap-2 px-4">
          <span className="text-2xl text-[#F5A623]">☽</span>
          <h1 className="text-[1.95rem] font-semibold tracking-tight text-[#F4F4F4]">Tasbih Digital</h1>
        </div>
      </div>

      <motion.main
        className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-36 pt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {!isListFormMode && (
          <>

        <section className="overflow-hidden rounded-3xl border border-[#2A2A2A] bg-gradient-to-b from-[#171717] to-[#121212]">
          <button
            type="button"
            onClick={() => setLibraryExpanded((prev) => !prev)}
            aria-expanded={libraryExpanded}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-[#F5A623]" strokeWidth={1.8} />
              <div>
                <div className="text-[0.875rem] font-semibold text-[#ECECEC]">
                  Bibliothèque de zikr
                  <span className="ml-2 text-[#5D5D5D]">({dhikrs.length})</span>
                </div>
              </div>
            </div>
            {libraryExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#666666]" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#666666]" strokeWidth={2} />
            )}
          </button>

          {libraryExpanded && (
            <div className="border-t border-[#242424]">
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B6B6B]" strokeWidth={2} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={(e) => setSearch(e.target.value.trim())}
                    placeholder="Rechercher un zikr..."
                    className="w-full rounded-2xl border border-[#3A3A3A] bg-[#202020] py-2.5 pl-11 pr-4 text-[0.95rem] text-white placeholder:text-[#5A5A5A] outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>

              <div className="max-h-[40vh] overflow-y-auto overscroll-contain border-t border-[#242424]">
                {categoryEntries.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-[#7A7A7A]">Aucun résultat trouvé</div>
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
                          className="group flex w-full items-center justify-between px-4 py-2.5 text-left"
                        >
                          <span className="flex-1 text-[0.95rem] font-semibold text-white transition-colors group-hover:text-[#F5A623]">
                            {category}
                          </span>
                          <span className="text-[0.95rem] font-semibold text-[#666666]">{items.length}</span>
                          <span className="ml-4 text-[0.95rem] text-[#5A5A5A]">{expanded ? "⌃" : "⌄"}</span>
                        </button>

                        {expanded && (
                          <div className="space-y-1 px-4 pb-3">
                            {items.map((d) => (
                              <button
                                type="button"
                                key={d.id}
                                onClick={() => setSelectedLibraryDhikr(d)}
                                className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-3 py-2.5 text-left transition hover:border-[#3E3E3E]"
                              >
                                <div className="text-[0.95rem] font-semibold text-white">{d.arabic}</div>
                                <div className="mt-0.5 flex items-center justify-between gap-3 text-[0.78rem] text-[#7A7A7A]">
                                  <span className="min-w-0 flex-1 truncate">{d.transliteration}</span>
                                  <span className="flex-shrink-0 font-semibold text-[#8A8A8A]">×{d.defaultTarget}</span>
                                </div>
                              </button>
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

        <section>
          <div className="flex items-center justify-between gap-3">
            <div className="whitespace-nowrap text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              LISTES PERSONNALISÉES
            </div>
            <button
              onClick={openCreateModal}
              className="whitespace-nowrap rounded-2xl border border-[#8B5A08] bg-[#6E4708] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[#F4C13A]"
            >
              ＋ Nouvelle liste
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {Object.keys(customLists).length === 0 ? (
              <div className="text-sm text-[#7A7A7A]">Aucune liste personnelle. Créez-en une.</div>
            ) : (
              Object.entries(customLists).map(([listId, items]) => {
                const expanded = expandedLists[listId] ?? false;
                const isActive = activeListId === listId;
                return (
                  <div
                    key={listId}
                    className={`overflow-hidden rounded-[28px] border border-[#2D2D2D] bg-[#141414] ${
                      isActive ? "ring-2 ring-[#F5A623]/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-4.5">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Grip className="h-4 w-4 text-[#595959]" strokeWidth={2} />
                        <button
                          onClick={() => selectList(listId)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-[0.9rem] font-semibold text-[#EFEFEF]">
                            {listId}
                            <span className="ml-2 text-[0.86rem] text-[#656565]">({formatZikrCount(items.length)})</span>
                          </div>
                        </button>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <button
                          onClick={() =>
                            setExpandedLists((prev) => ({
                              ...prev,
                              [listId]: !expanded,
                            }))
                          }
                          className="text-[#747474]"
                          aria-label={expanded ? "Réduire" : "Développer"}
                        >
                          {expanded ? <ChevronUp className="h-5 w-5" strokeWidth={2} /> : <ChevronDown className="h-5 w-5" strokeWidth={2} />}
                        </button>
                        <button
                          onClick={() => openEditListView(listId)}
                          className="text-[#8A8A8A]"
                          aria-label="Renommer"
                        >
                          <Pencil className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(listId)}
                          className="text-[#8A8A8A]"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-2 border-t border-[#2A2A2A] bg-[#151515] px-5 py-3">
                        {items.length === 0 ? (
                          <div className="text-sm text-[#7A7A7A]">Aucun Zikr dans cette liste.</div>
                        ) : (
                          items.map((dhikrId) => {
                            const dhikr = allDhikrsById.get(dhikrId);
                            if (!dhikr) return null;
                            return (
                              <button
                                type="button"
                                key={dhikrId}
                                onClick={() => setSelectedLibraryDhikr(dhikr)}
                                className="group flex w-full items-center justify-between gap-4 rounded-xl px-2 py-1 text-left transition hover:bg-[#1B1B1B]"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[1.05rem] font-semibold text-white transition-colors group-hover:text-[#F5A623]">
                                    {dhikr.arabic}
                                  </div>
                                  <div className="truncate text-[0.86rem] font-semibold text-[#6F6F73]">
                                    {dhikr.transliteration}
                                  </div>
                                </div>
                                <span className="ml-4 flex-shrink-0 text-[1rem] font-semibold text-[#79797E]">×{dhikr.defaultTarget}</span>
                              </button>
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

          </>
        )}

        {isListFormMode && (
          <section className="flex flex-col gap-5 pb-2">
            <h2 className="text-[2.15rem] font-semibold tracking-tight text-[#ECECEC]">
              {isEditMode ? "Modifier la liste" : "Nouvelle liste"}
            </h2>

            <div>
              <label className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#7E7E83]">Nom de la liste</label>
              <input
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder={isEditMode ? "Nom de la liste" : "Ex: Après la prière"}
                className="mt-3 w-full rounded-3xl border border-[#484848] bg-[#2A2A2A] px-5 py-4 text-[0.95rem] font-semibold text-white placeholder:text-[#5B5B5B] outline-none focus:border-[#F5A623]"
              />
              {hasDuplicateListName && (
                <p className="mt-2 text-xs text-[#E07A7A]">Ce nom de liste existe déjà.</p>
              )}
            </div>

            <div>
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#7E7E83]">Zikrs</div>
              <div className="mt-3 space-y-3 rounded-[28px] border border-[#2F2F2F] bg-[#151515] p-4">
                {createListItems.length === 0 ? (
                  <div className="text-sm text-[#7D7D7D]">Ajoute au moins un zikr depuis la bibliothèque ou l&apos;ajout manuel.</div>
                ) : (
                  createListItems.map(({ source, dhikr }, idx) => {
                    return (
                      <div
                        key={dhikr.id}
                        className="flex items-center justify-between rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#7E7E7E]">#{idx + 1}</span>
                            <div className="text-xs font-semibold text-white">{dhikr.arabic}</div>
                          </div>
                          <div className="text-xs text-[#8B8B8B]">
                            {dhikr.transliteration} · {dhikr.defaultTarget}
                            {source === "manual" ? " · Manuel" : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDhikrFromCreate(dhikr.id)}
                          className="ml-2 text-lg text-[#8B8B8B] hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setManualDhikrShow((prev) => !prev)}
              className="rounded-3xl border border-dashed border-[#C9C9C9] py-4 text-[1.05rem] font-semibold text-[#9C9C9C] transition hover:border-[#F5A623] hover:text-[#F5A623]"
            >
              + Ajouter manuellement
            </button>

            {manualDhikrShow && (
              <div className="space-y-3 rounded-[24px] border border-[#3A3A3A] bg-[#1A1A1A] p-4">
                <input
                  value={manualArabic}
                  onChange={(e) => setManualArabic(e.target.value)}
                  placeholder="(ex: سُبْحَانَ اللهِ) Texte arabe"
                  className="w-full rounded-2xl border border-[#474747] bg-[#2A2A2A] px-4 py-3 text-[0.95rem] text-white placeholder:text-[#666666] outline-none focus:border-[#F5A623]"
                />
                <input
                  value={manualTranslit}
                  onChange={(e) => setManualTranslit(e.target.value)}
                  onBlur={handleManualTranslitBlur}
                  placeholder="Translittération / nom"
                  className="w-full rounded-2xl border border-[#474747] bg-[#2A2A2A] px-4 py-3 text-[0.95rem] text-white placeholder:text-[#666666] outline-none focus:border-[#F5A623]"
                />
                {manualArabicSuggestion ? (
                  <p className="text-xs text-[#C89B32]">
                    Auto-complétion disponible: {manualArabicSuggestion}
                    {manualAutocompleteSuggestion?.transliteration
                      ? ` · ${manualAutocompleteSuggestion.transliteration}`
                      : ""}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <label className="text-[1rem] font-semibold text-[#8D8D8D]">Répétitions :</label>
                  <input
                    type="number"
                    min="1"
                    value={manualReps}
                    onChange={(e) => setManualReps(e.target.value)}
                    className="w-36 rounded-2xl border border-[#474747] bg-[#2A2A2A] px-4 py-2 text-[2rem] font-semibold text-white outline-none focus:border-[#F5A623]"
                  />
                </div>
                <p className="text-xs text-[#8A8A8A]">Pour ajouter manuellement, il faut un nombre de répétitions supérieur à 0 et au moins un des champs Texte arabe ou Translittération.</p>
                <button
                  onClick={handleAddManualDhikr}
                  disabled={!canAddManualDhikr}
                  className="w-full rounded-xl bg-[#F5A623] py-2.5 text-sm font-semibold text-black transition hover:bg-[#F5A623]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-[#2D2D2D] bg-[#151515]">
              <button
                type="button"
                onClick={() => setCreateLibraryExpanded(!createLibraryExpanded)}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-[2rem] text-[#F5A623]">◫</span>
                <span className="ml-3 flex-1 text-[0.95rem] font-semibold text-white">
                  Bibliothèque de zikr
                  <span className="ml-2 text-[#666666]">({dhikrs.length})</span>
                </span>
                <span className="text-[#666666]">{createLibraryExpanded ? "⌃" : "⌄"}</span>
              </button>

              {createLibraryExpanded && (
                <div className="space-y-2 border-t border-[#2D2D2D] px-3 pb-3 pt-2">
                  <input
                    value={createSearchQuery}
                    onChange={(e) => setCreateSearchQuery(e.target.value)}
                    onBlur={(e) => setCreateSearchQuery(e.target.value.trim())}
                    placeholder="Rechercher..."
                    className="w-full rounded-xl bg-[#2A2A2A] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]"
                  />
                  <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#0F0F0F] p-2">
                    {Array.from(createCategories.entries()).map(([category, items]) => {
                      const expanded = createCategoryExpanded[category] ?? false;
                      return (
                        <div key={category}>
                          <button
                            type="button"
                            onClick={() =>
                              setCreateCategoryExpanded((prev) => ({
                                ...prev,
                                [category]: !expanded,
                              }))
                            }
                            className="flex w-full items-center justify-between rounded px-2 py-1 text-xs font-semibold text-[#F5A623] hover:bg-[#1A1A1A]"
                          >
                            <span>{category}</span>
                            <span>{expanded ? "⌄" : "›"}</span>
                          </button>
                          {expanded && (
                            <div className="space-y-1 pl-2">
                              {items.map((d) => {
                                const isAdded = createListItems.some((item) => item.dhikr.id === d.id);
                                return (
                                  <div
                                    key={d.id}
                                    className="flex items-center justify-between rounded px-2 py-1 text-xs text-gray-300 hover:bg-[#1A1A1A]"
                                  >
                                    <div className="flex-1 truncate">
                                      <div className="truncate text-white">{d.arabic}</div>
                                      <div className="text-gray-500">{d.transliteration}</div>
                                    </div>
                                    <button
                                      onClick={() => handleAddDhikrToCreate(d.id)}
                                      disabled={isAdded}
                                      className="ml-2 rounded bg-[#F5A623] px-2 py-0.5 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#F5A623]/90"
                                    >
                                      +
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={closeModal}
                className="rounded-3xl border border-[#5A5A5A] bg-[#2A2A2A] px-4 py-3 text-[1.05rem] font-semibold text-[#E8E8E8]"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveListForm}
                disabled={!canSaveList}
                className="rounded-3xl bg-[#7D560D] px-4 py-3 text-[1.05rem] font-semibold text-[#D8D8D8] transition enabled:bg-[#F5A623] enabled:text-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isEditMode ? "Mettre à jour" : "Sauvegarder"}
              </button>
            </div>
          </section>
        )}

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
          isOpen={Boolean(selectedLibraryDhikr)}
          title="Aperçu du zikr"
          onClose={() => setSelectedLibraryDhikr(null)}
          closeOnOverlayClick
        >
          {selectedLibraryDhikr ? (
            <div className="rounded-2xl border border-[#2E2E2E] bg-[#141414] px-4 py-5 text-center">
              <div className="text-[1.7rem] font-semibold leading-relaxed text-white">
                {selectedLibraryDhikr.arabic}
              </div>
              <div className="mt-3 text-[0.95rem] font-semibold text-[#BEBEBE]">
                {selectedLibraryDhikr.transliteration}
              </div>
              <div className="mt-1 text-sm text-[#8A8A8A]">
                Objectif: {selectedLibraryDhikr.defaultTarget}
              </div>
            </div>
          ) : null}
        </Modal>

      </motion.main>
      <BottomNav />
    </div>
  );
}

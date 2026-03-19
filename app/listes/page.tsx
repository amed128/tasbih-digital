"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Grip, Pencil, Search, Trash2 } from "lucide-react";
import { useTasbihStore } from "../../store/tasbihStore";
import { dhikrs } from "../../data/dhikrs";
import type { Dhikr } from "../../data/dhikrs";
import { BottomNav } from "../../components/BottomNav";
import { Modal } from "../../components/Modal";
import { useT } from "@/hooks/useT";

type CreateListItem = {
  source: "library" | "manual";
  dhikr: Dhikr;
};

type DhikrAutocompleteSuggestion = {
  arabic: string;
  transliteration: string;
};

type DhikrAutocompleteMatch = {
  exact: DhikrAutocompleteSuggestion | null;
  suggestion: DhikrAutocompleteSuggestion | null;
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
  alhamdulillahi: {
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

function getExactAutocompleteSuggestion(value: string): DhikrAutocompleteSuggestion | null {
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

  return null;
}

function getAutocompleteSuggestion(value: string): DhikrAutocompleteSuggestion | null {
  const normalized = normalizeTransliteration(value);

  if (!normalized) return null;

  const exactMatch = getExactAutocompleteSuggestion(value);
  if (exactMatch) return exactMatch;

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

function getAutocompleteMatch(value: string): DhikrAutocompleteMatch {
  const exact = getExactAutocompleteSuggestion(value);
  if (exact) {
    return { exact, suggestion: exact };
  }

  return {
    exact: null,
    suggestion: getAutocompleteSuggestion(value),
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
  const listesUI = useTasbihStore((s) => s.listesUI);
  const setListesUI = useTasbihStore((s) => s.setListesUI);
  const t = useT();

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
  const [manualEditModalOpen, setManualEditModalOpen] = useState(false);
  const [manualEditingDhikrId, setManualEditingDhikrId] = useState<string | null>(null);
  const [manualArabicAutofilled, setManualArabicAutofilled] = useState(false);
  const [manualArabic, setManualArabic] = useState("");
  const [manualTranslit, setManualTranslit] = useState("");
  const [manualReps, setManualReps] = useState("33");
  const [createCategoryExpanded, setCreateCategoryExpanded] = useState<Record<string, boolean>>({});
  const [selectedLibraryDhikr, setSelectedLibraryDhikr] = useState<Dhikr | null>(null);

  const allDhikrsById = useMemo(() => {
    const entries = [...dhikrs, ...Object.values(customDhikrs)].map((dhikr) => [dhikr.id, dhikr] as const);
    return new Map<string, Dhikr>(entries);
  }, [customDhikrs]);

  const manualAutocomplete = useMemo(
    () => getAutocompleteMatch(manualTranslit.trim()),
    [manualTranslit]
  );

  const manualArabicSuggestion = useMemo(() => {
    if (manualAutocomplete.exact) return "";
    if (manualArabic.trim()) return "";
    return manualAutocomplete.suggestion?.arabic ?? "";
  }, [manualArabic, manualAutocomplete]);

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
    setManualEditModalOpen(false);
    setManualEditingDhikrId(null);
    setManualArabicAutofilled(false);
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
    setManualEditModalOpen(false);
    setManualEditingDhikrId(null);
    setManualArabicAutofilled(false);
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

    if (manualEditingDhikrId === dhikrId) {
      setManualEditModalOpen(false);
      setManualEditingDhikrId(null);
      setManualArabicAutofilled(false);
      setManualArabic("");
      setManualTranslit("");
      setManualReps("33");
      setManualDhikrShow(false);
    }
  };

  const startEditingManualDhikr = (dhikr: Dhikr) => {
    const exactMatch = getExactAutocompleteSuggestion(dhikr.transliteration);
    setManualEditingDhikrId(dhikr.id);
    setManualArabicAutofilled(Boolean(exactMatch && exactMatch.arabic === dhikr.arabic));
    setManualArabic(dhikr.arabic);
    setManualTranslit(dhikr.transliteration);
    setManualReps(String(dhikr.defaultTarget));
    setManualDhikrShow(false);
    setManualEditModalOpen(true);
  };

  const closeManualEditModal = () => {
    setManualEditModalOpen(false);
    setManualEditingDhikrId(null);
    setManualArabicAutofilled(false);
    setManualArabic("");
    setManualTranslit("");
    setManualReps("33");
  };

  const handleManualArabicChange = (value: string) => {
    setManualArabic(value);
    setManualArabicAutofilled(false);
  };

  const handleManualTranslitChange = (value: string) => {
    setManualTranslit(value);

    const exactMatch = getExactAutocompleteSuggestion(value);
    if (exactMatch) {
      setManualArabic(exactMatch.arabic);
      setManualArabicAutofilled(true);
      return;
    }

    if (manualArabicAutofilled) {
      setManualArabic("");
      setManualArabicAutofilled(false);
    }
  };

  const handleAddManualDhikr = () => {
    const editingId = manualEditingDhikrId;
    const transliteration = manualTranslit.trim();
    const exactMatch = getExactAutocompleteSuggestion(transliteration);
    const arabic = manualArabic.trim() || exactMatch?.arabic || transliteration;
    const repetitions = Number.parseInt(manualReps.trim(), 10);

    if (!canAddManualDhikr) return;

    const manualDhikr: Dhikr = {
      id: editingId ?? `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      arabic,
      transliteration: transliteration || manualArabic.trim(),
      translation_fr: transliteration || manualArabic.trim(),
      translation_en: transliteration || manualArabic.trim(),
      defaultTarget: repetitions,
      category: "Dhikr général",
    };

    if (editingId) {
      setCreateListItems((prev) =>
        prev.map((item) =>
          item.dhikr.id === editingId ? { source: "manual", dhikr: manualDhikr } : item
        )
      );
    } else {
      setCreateListItems((prev) => [...prev, { source: "manual", dhikr: manualDhikr }]);
    }

    setManualEditingDhikrId(null);
    setManualEditModalOpen(false);
    setManualArabicAutofilled(false);
    setManualArabic("");
    setManualTranslit("");
    setManualReps("33");
    setManualDhikrShow(false);
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
    setManualEditModalOpen(false);
    setManualEditingDhikrId(null);
    setManualArabicAutofilled(false);
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

  const togglePersonalList = (listId: string) => {
    setExpandedLists((prev) => ({
      ...prev,
      [listId]: !(prev[listId] ?? false),
    }));
    selectList(listId);
  };

  if (!mounted) return null;

  const isSearching = search.trim().length > 0;
  const categoryEntries = Array.from(categories.entries());

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-18 w-full max-w-md items-center justify-center gap-2 px-4">
          <span className="text-2xl text-[var(--primary)]">☽</span>
          <h1 className="text-[1.95rem] font-semibold tracking-tight text-[var(--foreground)]">Tasbih Digital</h1>
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

        <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
          <button
            type="button"
            onClick={() => setLibraryExpanded((prev) => !prev)}
            aria-expanded={libraryExpanded}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-[var(--primary)]" strokeWidth={1.8} />
              <div>
                <div className="text-[0.875rem] font-semibold text-[var(--foreground)]">
                  {t("lists.libraryTitle")}
                  <span className="ml-2 text-[var(--secondary)]">({dhikrs.length})</span>
                </div>
              </div>
            </div>
            {libraryExpanded ? (
              <ChevronUp className="h-5 w-5 text-[var(--secondary)]" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-5 w-5 text-[var(--secondary)]" strokeWidth={2} />
            )}
          </button>

          {libraryExpanded && (
            <div className="border-t border-[var(--border)]">
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--secondary)]" strokeWidth={2} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={(e) => setSearch(e.target.value.trim())}
                    placeholder={t("lists.searchPlaceholder")}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-11 pr-4 text-[0.95rem] text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="max-h-[40vh] overflow-y-auto overscroll-contain border-t border-[var(--border)]">
                {categoryEntries.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-[var(--secondary)]">{t("lists.noResults")}</div>
                ) : (
                  categoryEntries.map(([category, items]) => {
                    const expanded = isSearching ? true : expandedCategories[category] ?? false;
                    return (
                      <div key={category} className="border-b border-[var(--border)] last:border-b-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [category]: !expanded,
                            }))
                          }
                          aria-expanded={expanded}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left"
                        >
                          <span className="flex-1 text-[0.95rem] font-semibold text-[var(--primary)]">
                            {category}
                          </span>
                          <span className="text-[0.95rem] font-semibold text-[var(--secondary)]">{items.length}</span>
                          <span className="ml-4 text-[0.95rem] text-[var(--secondary)]">{expanded ? "⌃" : "⌄"}</span>
                        </button>

                        {expanded && (
                          <div className="space-y-1 px-4 pb-3">
                            {items.map((d) => (
                              <button
                                type="button"
                                key={d.id}
                                onClick={() => setSelectedLibraryDhikr(d)}
                                className="group w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-left transition hover:border-[#3E3E3E]"
                              >
                                <div className="text-[0.95rem] font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">{d.arabic}</div>
                                <div className="mt-0.5 flex items-center justify-between gap-3 text-[var(--secondary)]">
                                  <span className="min-w-0 flex-1 truncate text-[0.86rem] font-semibold">{d.transliteration}</span>
                                  <span className="flex-shrink-0 font-semibold text-[var(--secondary)]">×{d.defaultTarget}</span>
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
            <div className="whitespace-nowrap text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
              {t("lists.personalListsTitle")}
            </div>
            <button
              onClick={openCreateModal}
              className="whitespace-nowrap rounded-2xl border border-[var(--primary)] bg-[var(--card)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--primary)]"
            >
              {t("lists.newListBtn")}
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {Object.keys(customLists).length === 0 ? (
              <div className="text-sm text-[var(--secondary)]">{t("lists.noPersonalLists")}</div>
            ) : (
              Object.entries(customLists).map(([listId, items]) => {
                const expanded = expandedLists[listId] ?? false;
                return (
                  <div
                    key={listId}
                    className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => togglePersonalList(listId)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        togglePersonalList(listId);
                      }}
                      className="flex items-center justify-between px-4 py-4.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Grip className="h-4 w-4 text-[var(--secondary)]" strokeWidth={2} />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate text-[0.9rem] font-semibold text-[var(--foreground)]">
                            {listId}
                            <span className="ml-2 text-[0.86rem] text-[var(--secondary)]">({formatZikrCount(items.length)})</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedLists((prev) => ({
                              ...prev,
                              [listId]: !expanded,
                            }));
                          }}
                          className="text-[var(--secondary)]"
                          aria-label={expanded ? t("lists.ariaCollapse") : t("lists.ariaExpand")}
                        >
                          {expanded ? <ChevronUp className="h-5 w-5" strokeWidth={2} /> : <ChevronDown className="h-5 w-5" strokeWidth={2} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditListView(listId);
                          }}
                          className="text-[var(--secondary)]"
                          aria-label={t("lists.ariaRename")}
                        >
                          <Pencil className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(listId);
                          }}
                          className="text-[var(--secondary)]"
                          aria-label={t("lists.ariaDelete")}
                        >
                          <Trash2 className="h-5 w-5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-2 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3">
                        {items.length === 0 ? (
                          <div className="text-sm text-[var(--secondary)]">{t("lists.noZikrInList")}</div>
                        ) : (
                          items.map((dhikrId) => {
                            const dhikr = allDhikrsById.get(dhikrId);
                            if (!dhikr) return null;
                            return (
                              <button
                                type="button"
                                key={dhikrId}
                                onClick={() => setSelectedLibraryDhikr(dhikr)}
                                className="group flex w-full items-center justify-between gap-4 rounded-xl px-2 py-1 text-left transition hover:bg-[color:var(--border)]/45"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[1.05rem] font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                                    {dhikr.arabic}
                                  </div>
                                  <div className="truncate text-[0.86rem] font-semibold text-[var(--secondary)]">
                                    {dhikr.transliteration}
                                  </div>
                                </div>
                                <span className="ml-4 flex-shrink-0 text-[1rem] font-semibold text-[var(--secondary)]">×{dhikr.defaultTarget}</span>
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
            <h2 className="text-[2.15rem] font-semibold tracking-tight text-[var(--foreground)]">
              {isEditMode ? t("lists.editListTitle") : t("lists.newListTitle")}
            </h2>

            <div>
              <label className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">{t("lists.listNameLabel")}</label>
              <input
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder={isEditMode ? t("lists.listNameEditPlaceholder") : t("lists.listNamePlaceholder")}
                className="mt-3 w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-[0.95rem] font-semibold text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)]"
              />
              {hasDuplicateListName && (
                <p className="mt-2 text-xs text-[#D32F2F]">{t("lists.duplicateName")}</p>
              )}
            </div>

            <div>
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">{t("lists.zikrsLabel")}</div>
              <div className="mt-3 space-y-3 rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-4">
                {createListItems.length === 0 ? (
                  <div className="text-sm text-[var(--secondary)]">{t("lists.addAtLeastOne")}</div>
                ) : (
                  createListItems.map(({ source, dhikr }, idx) => {
                    const isManual = source === "manual";
                    return (
                      <div
                        key={dhikr.id}
                        role={isManual ? "button" : undefined}
                        tabIndex={isManual ? 0 : undefined}
                        onClick={isManual ? () => startEditingManualDhikr(dhikr) : undefined}
                        onKeyDown={
                          isManual
                            ? (e) => {
                                if (e.key !== "Enter" && e.key !== " ") return;
                                e.preventDefault();
                                startEditingManualDhikr(dhikr);
                              }
                            : undefined
                        }
                        className={`flex items-center justify-between rounded-2xl border bg-[var(--background)] px-3 py-2 ${
                          isManual
                            ? "cursor-pointer border-[var(--primary)]/40 hover:border-[var(--primary)]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--secondary)]">#{idx + 1}</span>
                            {isManual ? (
                              <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--primary)]">
                                {t("lists.manualTag")}
                              </span>
                            ) : null}
                            <div className="text-xs font-semibold text-[var(--foreground)]">{dhikr.arabic}</div>
                          </div>
                          <div className="text-xs text-[var(--secondary)]">
                            {dhikr.transliteration} · {dhikr.defaultTarget}
                          </div>
                          {isManual ? (
                            <div className="mt-1 text-[0.68rem] font-semibold text-[var(--primary)]">
                              {t("lists.manualEditHint")}
                            </div>
                          ) : null}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDhikrFromCreate(dhikr.id);
                          }}
                          className="ml-2 text-lg text-[var(--secondary)] hover:text-[var(--foreground)]"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              {createListItems.some((item) => item.source === "manual") ? (
                <p className="mt-2 text-xs text-[var(--primary)]">{t("lists.manualEditHint")}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                if (manualEditModalOpen) closeManualEditModal();
                setManualDhikrShow((prev) => !prev);
              }}
              className="rounded-3xl border border-dashed border-[var(--border)] py-4 text-[1.05rem] font-semibold text-[var(--secondary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {t("lists.addManualBtn")}
            </button>

            {manualDhikrShow && (
              <div className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-4">
                <input
                  value={manualArabic}
                  onChange={(e) => handleManualArabicChange(e.target.value)}
                  placeholder={t("lists.arabicPlaceholder")}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[0.95rem] text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)]"
                />
                <input
                  value={manualTranslit}
                  onChange={(e) => handleManualTranslitChange(e.target.value)}
                  placeholder={t("lists.translitPlaceholder")}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[0.95rem] text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)]"
                />
                {manualArabicSuggestion ? (
                  <p className="text-xs text-[var(--primary)]">
                    {t("lists.autocompleteHint")} {manualArabicSuggestion}
                    {manualAutocomplete.suggestion?.transliteration
                      ? ` · ${manualAutocomplete.suggestion.transliteration}`
                      : ""}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <label className="text-[1rem] font-semibold text-[var(--foreground)]">{t("lists.repsLabel")}</label>
                  <input
                    type="number"
                    min="1"
                    value={manualReps}
                    onChange={(e) => setManualReps(e.target.value)}
                    className="w-36 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[2rem] font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <p className="text-xs text-[var(--secondary)]">{t("lists.manualHint")}</p>
                <button
                  onClick={handleAddManualDhikr}
                  disabled={!canAddManualDhikr}
                  className="w-full rounded-xl bg-[var(--primary)] py-2.5 text-sm font-semibold text-black transition hover:bg-[color:var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {manualEditingDhikrId ? t("lists.manualSaveBtn") : t("lists.addBtn")}
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
              <button
                type="button"
                onClick={() => setCreateLibraryExpanded(!createLibraryExpanded)}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-[2rem] text-[var(--primary)]">◫</span>
                <span className="ml-3 flex-1 text-[0.95rem] font-semibold text-[var(--foreground)]">
                  {t("lists.libraryTitle")}
                  <span className="ml-2 text-[var(--secondary)]">({dhikrs.length})</span>
                </span>
                <span className="text-[var(--secondary)]">{createLibraryExpanded ? "⌃" : "⌄"}</span>
              </button>

              {createLibraryExpanded && (
                <div className="space-y-2 border-t border-[var(--border)] px-3 pb-3 pt-2">
                  <input
                    value={createSearchQuery}
                    onChange={(e) => setCreateSearchQuery(e.target.value)}
                    onBlur={(e) => setCreateSearchQuery(e.target.value.trim())}
                    placeholder={t("lists.searchInLibrary")}
                    className="w-full rounded-xl bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
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
                            className="flex w-full items-center justify-between rounded px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--card)]"
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
                                    className="flex items-center justify-between rounded px-2 py-1 text-xs text-[var(--secondary)] hover:bg-[var(--card)]"
                                  >
                                    <div className="flex-1 truncate">
                                      <div className="truncate text-[var(--foreground)]">{d.arabic}</div>
                                      <div className="text-[var(--secondary)]">{d.transliteration}</div>
                                    </div>
                                    <button
                                      onClick={() => handleAddDhikrToCreate(d.id)}
                                      disabled={isAdded}
                                      className="ml-2 rounded bg-[var(--primary)] px-2 py-0.5 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[color:var(--primary)]/90"
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
                className="rounded-3xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[1.05rem] font-semibold text-[var(--foreground)]"
              >
                {t("lists.cancel")}
              </button>
              <button
                onClick={handleSaveListForm}
                disabled={!canSaveList}
                className="rounded-3xl bg-[var(--card)] px-4 py-3 text-[1.05rem] font-semibold text-[var(--foreground)] transition enabled:bg-[var(--primary)] enabled:text-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isEditMode ? t("lists.updateBtn") : t("lists.saveBtn")}
              </button>
            </div>
          </section>
        )}

        <Modal
          isOpen={modalType === "delete"}
          title={t("lists.deleteModalTitle")}
          onClose={closeModal}
          closeOnOverlayClick={false}
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-xl bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("lists.cancel")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white"
              >
                {t("lists.deleteConfirm")}
              </button>
            </div>
          }
        >
          <div className="text-sm text-[var(--secondary)]">
            {t("lists.deleteModalBody", { name: modalListId ?? "" })}
          </div>
        </Modal>

        <Modal
          isOpen={manualEditModalOpen && Boolean(manualEditingDhikrId)}
          title={t("lists.manualEditTitle")}
          onClose={closeManualEditModal}
          closeOnOverlayClick
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={closeManualEditModal}
                className="rounded-xl bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("lists.cancel")}
              </button>
              <button
                onClick={handleAddManualDhikr}
                disabled={!canAddManualDhikr}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("lists.manualSaveBtn")}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <input
              value={manualArabic}
              onChange={(e) => handleManualArabicChange(e.target.value)}
              placeholder={t("lists.arabicPlaceholder")}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[0.95rem] text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)]"
            />
            <input
              value={manualTranslit}
              onChange={(e) => handleManualTranslitChange(e.target.value)}
              placeholder={t("lists.translitPlaceholder")}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[0.95rem] text-[var(--foreground)] placeholder:text-[var(--secondary)] outline-none focus:border-[var(--primary)]"
            />
            {manualArabicSuggestion ? (
              <p className="text-xs text-[var(--primary)]">
                {t("lists.autocompleteHint")} {manualArabicSuggestion}
                {manualAutocomplete.suggestion?.transliteration
                  ? ` · ${manualAutocomplete.suggestion.transliteration}`
                  : ""}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <label className="text-[1rem] font-semibold text-[var(--foreground)]">{t("lists.repsLabel")}</label>
              <input
                type="number"
                min="1"
                value={manualReps}
                onChange={(e) => setManualReps(e.target.value)}
                className="w-36 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[2rem] font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(selectedLibraryDhikr)}
          title={t("lists.previewTitle")}
          onClose={() => setSelectedLibraryDhikr(null)}
          closeOnOverlayClick
        >
          {selectedLibraryDhikr ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 text-center">
              <div className="text-[1.7rem] font-semibold leading-relaxed text-[var(--foreground)]">
                {selectedLibraryDhikr.arabic}
              </div>
              <div className="mt-3 text-[0.95rem] font-semibold text-[var(--secondary)]">
                {selectedLibraryDhikr.transliteration}
              </div>
              <div className="mt-1 text-sm text-[var(--secondary)]">
                {t("lists.previewTarget", { count: selectedLibraryDhikr.defaultTarget })}
              </div>
            </div>
          ) : null}
        </Modal>

      </motion.main>
      <BottomNav />
    </div>
  );
}

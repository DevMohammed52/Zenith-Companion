"use client";

import React from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Pagination,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  type TableSortDirection,
} from "@/components/ui";
import {
  formatGuildNumber,
  GUILD_TIER_LABELS,
  type GuildRecord,
  type GuildSortKey,
} from "@/lib/guilds";
import {
  GUILD_PAGE_SIZE_OPTIONS,
  type EnrichedGuildRecord,
} from "../types";
import { GuildMobileCard } from "./GuildMobileCard";
import styles from "../page.module.css";

export interface GuildsTableProps {
  showCardLayout: boolean;
  showTableLayout: boolean;
  visibleGuilds: EnrichedGuildRecord[];
  filteredGuilds: EnrichedGuildRecord[];
  sortBy: GuildSortKey;
  setSortBy: (key: GuildSortKey) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  loadDetails: (guild: GuildRecord) => void;
}

export function GuildsTable({
  showCardLayout,
  showTableLayout,
  visibleGuilds,
  filteredGuilds,
  sortBy,
  setSortBy,
  page,
  pageSize,
  totalPages,
  setPage,
  setPageSize,
  hasActiveFilters,
  resetFilters,
  loadDetails,
}: GuildsTableProps) {
  const sortDirectionFor = (columnKey: GuildSortKey): TableSortDirection => {
    if (sortBy !== columnKey) return "none";
    return columnKey === "season" || columnKey === "name" || columnKey === "id"
      ? "ascending"
      : "descending";
  };

  return (
    <Card padding="md" className={styles.directoryCard}>
      {filteredGuilds.length === 0 ? (
        <EmptyState
          variant="search-empty"
          title="No guilds match the current filters"
          description="Clear the search term, tier filter, or quick toggle chips to widen the directory."
          action={
            hasActiveFilters
              ? { label: "Reset filters", onClick: resetFilters }
              : undefined
          }
        />
      ) : (
        <>
          {showTableLayout && (
            <TableContainer ariaLabel="Guild database results">
              <Table density="normal" hoverable>
                <TableCaption visuallyHidden>Guild database results</TableCaption>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead
                      sortable
                      sortDirection={sortDirectionFor("season")}
                      onSort={() => setSortBy("season")}
                    >
                      Season
                    </TableHead>
                    <TableHead
                      sortable
                      sortDirection={sortDirectionFor("name")}
                      onSort={() => setSortBy("name")}
                    >
                      Guild
                    </TableHead>
                    <TableHead
                      align="right"
                      sortable
                      sortDirection={sortDirectionFor("level")}
                      onSort={() => setSortBy("level")}
                    >
                      Level
                    </TableHead>
                    <TableHead
                      sortable
                      sortDirection={sortDirectionFor("members")}
                      onSort={() => setSortBy("members")}
                    >
                      Roster
                    </TableHead>
                    <TableHead
                      align="right"
                      sortable
                      sortDirection={sortDirectionFor("marks")}
                      onSort={() => setSortBy("marks")}
                    >
                      Marks
                    </TableHead>
                    <TableHead align="right">Avg TL</TableHead>
                    <TableHead>Conquest</TableHead>
                    <TableHead align="right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleGuilds.map((guild) => (
                    <TableRow
                      key={guild.id}
                      interactive
                      selected={guild.isMyGuild}
                      className={styles.tableRowInteractive}
                      onClick={() => loadDetails(guild)}
                    >
                      <TableCell numeric>
                        {guild.season_position ? (
                          <Badge variant={guild.season_position <= 3 ? "warning" : "neutral"} size="sm">
                            #{guild.season_position}
                          </Badge>
                        ) : (
                          <span className={styles.mutedNote}>-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className={styles.guildCellWrap}>
                          <GameImage
                            src={guild.icon_url}
                            alt=""
                            width={38}
                            height={38}
                            sizes="38px"
                            className={styles.guildIcon}
                            loading="lazy"
                            fallback={
                              <span className={styles.guildIconFallback}>
                                <Icon name="guilds" size="md" aria-hidden="true" />
                              </span>
                            }
                          />
                          <div className={styles.nameBlock}>
                            <div className={styles.guildTitleLine}>
                              <strong>{guild.name}</strong>
                              {guild.isMyGuild && (
                                <Badge variant="refined" size="sm">Yours</Badge>
                              )}
                            </div>
                            <span className={styles.guildSubLine}>
                              #{guild.id}
                              {guild.tag ? ` · [${guild.tag}]` : ""}
                              {" · "}
                              {GUILD_TIER_LABELS[guild.refresh_tier]}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell numeric>
                        {formatGuildNumber(guild.level)}
                      </TableCell>

                      <TableCell>
                        <div className={styles.rosterCell}>
                          <span className={styles.rosterRatio}>
                            {guild.member_count}/{guild.maxMembers}
                          </span>
                          {guild.openSlots > 0 && (
                            <Badge variant="success" size="sm">
                              {guild.openSlots} open
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell numeric>
                        {formatGuildNumber(guild.marks)}
                      </TableCell>

                      <TableCell numeric>
                        {formatGuildNumber(guild.average_total_level)}
                      </TableCell>

                      <TableCell onClick={(event) => event.stopPropagation()}>
                        {guild.conquestZones.length > 0 ? (
                          <div className={styles.zoneCellPills}>
                            {guild.conquestZones.slice(0, 2).map((zone) => (
                              <Link
                                key={`${guild.id}-${zone.zoneKey}`}
                                href={`/conquest?zone=${encodeURIComponent(zone.zoneKey)}`}
                                className={styles.zoneChipLink}
                                title={`View ${zone.zoneName} in Conquest`}
                              >
                                <Icon name="conquest" size="xs" aria-hidden="true" />
                                <span>
                                  {zone.zoneName}
                                  {zone.position ? ` #${zone.position}` : ""}
                                </span>
                              </Link>
                            ))}
                            {guild.conquestZones.length > 2 && (
                              <span className={styles.zoneMoreCount}>
                                +{guild.conquestZones.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={styles.mutedNote}>-</span>
                        )}
                      </TableCell>

                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Icon name="view" size="sm" />}
                          onClick={() => loadDetails(guild)}
                          aria-label={`View ${guild.name} guild details`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {showCardLayout && (
            <div className={styles.cardGrid} aria-label="Guild results">
              {visibleGuilds.map((guild) => (
                <GuildMobileCard
                  guild={guild}
                  key={`card-${guild.id}`}
                  onInspect={loadDetails}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.paginationWrap}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredGuilds.length}
                pageSize={pageSize}
                pageSizeOptions={[...GUILD_PAGE_SIZE_OPTIONS]}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="guilds"
                showSummary={false}
                scrollToTop
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

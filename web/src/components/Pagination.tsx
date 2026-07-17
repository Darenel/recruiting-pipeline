import { useI18n } from "../i18n";

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const displayPage = page + 1;
  const start = total === 0 ? 0 : page * limit + 1;
  const end = Math.min(total, (page + 1) * limit);

  return (
    <div className="pagination">
      <span>
        {start}-{end} {t("common.of")} {total}
      </span>
      <div className="pagination-controls">
        <button className="ghost" disabled={page <= 0} onClick={() => onPageChange(page - 1)} type="button">
          {t("common.previous")}
        </button>
        <span>
          {t("common.page")} {displayPage} {t("common.of")} {totalPages}
        </span>
        <button className="ghost" disabled={displayPage >= totalPages} onClick={() => onPageChange(page + 1)} type="button">
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}

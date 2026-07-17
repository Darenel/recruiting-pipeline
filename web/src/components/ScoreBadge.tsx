import { useI18n } from "../i18n";

type ScoreBadgeProps = {
  score: number;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const { t } = useI18n();
  const tone = score >= 70 ? "success" : score >= 40 ? "primary" : "quiet";
  return <span className={`badge badge-${tone}`}>{`${t("common.score")} ${Math.round(score)}`}</span>;
}

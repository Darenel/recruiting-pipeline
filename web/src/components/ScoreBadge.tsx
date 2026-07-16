import { formatScore } from "../utils";

type ScoreBadgeProps = {
  score: number;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const tone = score >= 70 ? "success" : score >= 40 ? "primary" : "quiet";
  return <span className={`badge badge-${tone}`}>{formatScore(score)}</span>;
}

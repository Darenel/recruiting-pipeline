package dev.darenel.recruiting.scoring;

import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Vacancy;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    public int score(Vacancy vacancy, Candidate candidate) {
        double stackOverlap = requiredStackOverlap(vacancy.getStacks(), candidate.getStacks());
        return score(vacancy.getStacks(), candidate.getStacks(), candidate.getYearsExperience(),
                vacancy.getSeniorityYears(), stackOverlap);
    }

    public int score(Set<Stack> requiredStacks, Set<Stack> candidateStacks, int yearsExperience, int seniorityYears,
            double bonusSkillOverlap) {
        double stackMatch = requiredStackOverlap(requiredStacks, candidateStacks);
        double experienceMatch = experienceMatch(yearsExperience, seniorityYears);
        double normalizedBonus = clamp01(bonusSkillOverlap);

        double value = 100 * (0.6 * stackMatch + 0.25 * experienceMatch + 0.15 * normalizedBonus);
        return (int) Math.round(value);
    }

    private double requiredStackOverlap(Set<Stack> requiredStacks, Set<Stack> candidateStacks) {
        if (requiredStacks == null || requiredStacks.isEmpty()) {
            return 0;
        }
        if (candidateStacks == null || candidateStacks.isEmpty()) {
            return 0;
        }

        long matched = requiredStacks.stream()
                .filter(candidateStacks::contains)
                .count();
        return (double) matched / requiredStacks.size();
    }

    private double experienceMatch(int yearsExperience, int seniorityYears) {
        if (seniorityYears <= 0) {
            return 1;
        }
        return clamp01((double) Math.max(yearsExperience, 0) / seniorityYears);
    }

    private double clamp01(double value) {
        if (value < 0) {
            return 0;
        }
        if (value > 1) {
            return 1;
        }
        return value;
    }
}

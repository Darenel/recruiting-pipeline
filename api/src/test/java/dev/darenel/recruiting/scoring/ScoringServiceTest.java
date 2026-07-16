package dev.darenel.recruiting.scoring;

import static org.assertj.core.api.Assertions.assertThat;

import dev.darenel.recruiting.domain.Stack;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ScoringServiceTest {

    private final ScoringService scoring = new ScoringService();

    @Test
    void fullMatchScoresOneHundred() {
        int score = scoring.score(Set.of(Stack.JAVA, Stack.SQL), Set.of(Stack.JAVA, Stack.SQL), 5, 5, 1);

        assertThat(score).isEqualTo(100);
    }

    @Test
    void partialMatchKeepsFormulaWeightsVisible() {
        int score = scoring.score(Set.of(Stack.JAVA, Stack.SQL), Set.of(Stack.JAVA), 2, 4, 0.5);

        assertThat(score).isEqualTo(50);
    }

    @Test
    void zeroMatchAndNoExperienceScoresZero() {
        int score = scoring.score(Set.of(Stack.REACT), Set.of(Stack.PYTHON), 0, 3, 0);

        assertThat(score).isZero();
    }

    @Test
    void experienceContributionCapsAtOne() {
        int score = scoring.score(Set.of(Stack.REACT), Set.of(), 8, 2, 0);

        assertThat(score).isEqualTo(25);
    }

    @Test
    void bonusOverlapIsWeightedAndClamped() {
        int withoutBonus = scoring.score(Set.of(Stack.JAVA), Set.of(Stack.JAVA), 0, 5, 0);
        int withBonus = scoring.score(Set.of(Stack.JAVA), Set.of(Stack.JAVA), 0, 5, 2);

        assertThat(withoutBonus).isEqualTo(60);
        assertThat(withBonus).isEqualTo(75);
    }
}

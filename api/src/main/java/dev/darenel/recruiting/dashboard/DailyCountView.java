package dev.darenel.recruiting.dashboard;

import java.time.LocalDate;

public interface DailyCountView {

    LocalDate getDay();

    long getCount();
}

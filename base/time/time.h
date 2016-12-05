// Copyright (c) 2014 Project Vogue. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#if !defined(INCLUDE_base_time_time_h)
#define INCLUDE_base_time_time_h

namespace base {

class Time;
class TimeDelta;
class TimeTicks;

class TimeDelta {
  friend class Time;
  friend class TimeTicks;

  private: int64_t delta_;

  public: TimeDelta() : delta_(0) {}
  private: explicit TimeDelta(int64_t delta) : delta_(delta) {}

  public: bool operator==(const TimeDelta& other) const;
  public: bool operator!=(const TimeDelta& other) const;
  public: bool operator<(const TimeDelta& other) const;
  public: bool operator<=(const TimeDelta& other) const;
  public: bool operator>(const TimeDelta& other) const;
  public: bool operator>=(const TimeDelta& other) const;

  public: TimeDelta operator+(const TimeDelta& other) const;
  public: TimeDelta operator-(const TimeDelta& other) const;

  public: static TimeDelta FromMilliseconds(int64_t ms);
  public: static TimeDelta FromMicroseconds(int64_t us);

  public: int64_t InMilliseconds() const;
  public: double InMillisecondsF() const;
  public: int64_t InMicroseconds() const;
};

bool TimeDelta::operator==(const TimeDelta& other) const {
  return delta_ == other.delta_;
}

bool TimeDelta::operator!=(const TimeDelta& other) const {
  return delta_ != other.delta_;
}

bool TimeDelta::operator<(const TimeDelta& other) const {
  return delta_ < other.delta_;
}

bool TimeDelta::operator<=(const TimeDelta& other) const {
  return delta_ <= other.delta_;
}

bool TimeDelta::operator>(const TimeDelta& other) const {
  return delta_ > other.delta_;
}

bool TimeDelta::operator>=(const TimeDelta& other) const {
  return delta_ >= other.delta_;
}

TimeDelta TimeDelta::operator+(const TimeDelta& other) const {
  return TimeDelta(delta_ + other.delta_);
}

TimeDelta TimeDelta::operator-(const TimeDelta& other) const {
  return TimeDelta(delta_ - other.delta_);
}

//////////////////////////////////////////////////////////////////////
//
// Time
//
class Time {
  public: static const int64_t kMillisecondsPerSecond = 1000;
  public: static const int64_t kMicrosecondsPerMillisecond = 1000;
  public: static const int64_t kMicrosecondsPerSecond =
      kMicrosecondsPerMillisecond * kMillisecondsPerSecond;
  public: static const int64_t kMicrosecondsPerMinute =
      kMicrosecondsPerSecond * 60;
  public: static const int64_t kMicrosecondsPerHour = kMicrosecondsPerMinute * 60;
  public: static const int64_t kMicrosecondsPerDay = kMicrosecondsPerHour * 24;
  public: static const int64_t kMicrosecondsPerWeek = kMicrosecondsPerDay * 7;
  public: static const int64_t kNanosecondsPerMicrosecond = 1000;
  public: static const int64_t kNanosecondsPerSecond =
      kNanosecondsPerMicrosecond * kMicrosecondsPerSecond;
};

TimeDelta TimeDelta::FromMilliseconds(int64_t ms) {
  return TimeDelta(ms * Time::kMicrosecondsPerMillisecond);
}

TimeDelta TimeDelta::FromMicroseconds(int64_t us) {
  return TimeDelta(us);
}

int64_t TimeDelta::InMilliseconds() const {
  return delta_ / Time::kMicrosecondsPerMillisecond;
}

double TimeDelta::InMillisecondsF() const {
  return static_cast<double>(delta_) / Time::kMicrosecondsPerMillisecond;
}

int64_t TimeDelta::InMicroseconds() const {
  return delta_ * Time::kMicrosecondsPerMillisecond;
}

class TimeTicks {
  // Tick count in microseconds.
  private: int64_t ticks_;

  public: TimeTicks(const TimeTicks& other);
  private: explicit TimeTicks(int64_t ticks);
  public: TimeTicks();
  public: ~TimeTicks() = default;

  public: bool operator==(const TimeTicks& other) const;
  public: bool operator!=(const TimeTicks& other) const;
  public: bool operator<(const TimeTicks& other) const;
  public: bool operator<=(const TimeTicks& other) const;
  public: bool operator>(const TimeTicks& other) const;
  public: bool operator>=(const TimeTicks& other) const;

  public: TimeTicks operator+(const TimeDelta& delta) const;
  public: TimeTicks operator-(const TimeDelta& delta) const;
  public: TimeDelta operator-(const TimeTicks& other) const;

  public: int64_t milliseconds() const;

  public: static TimeTicks Now();
};

TimeTicks::TimeTicks(const TimeTicks& other) : ticks_(other.ticks_) {
}

TimeTicks::TimeTicks(int64_t ticks) : ticks_(ticks) {
}

TimeTicks::TimeTicks() : TimeTicks(0) {
}

bool TimeTicks::operator==(const TimeTicks& other) const {
  return ticks_ == other.ticks_;
}

bool TimeTicks::operator!=(const TimeTicks& other) const {
  return ticks_ != other.ticks_;
}

bool TimeTicks::operator<(const TimeTicks& other) const {
  return ticks_ < other.ticks_;
}

bool TimeTicks::operator<=(const TimeTicks& other) const {
  return ticks_ <= other.ticks_;
}

bool TimeTicks::operator>(const TimeTicks& other) const {
  return ticks_ > other.ticks_;
}

bool TimeTicks::operator>=(const TimeTicks& other) const {
  return ticks_ >= other.ticks_;
}

TimeTicks TimeTicks::operator+(const TimeDelta& delta) const {
  return TimeTicks(ticks_ + delta.delta_);
}


TimeTicks TimeTicks::operator-(const TimeDelta& delta) const {
  return TimeTicks(ticks_ - delta.delta_);
}

TimeDelta TimeTicks::operator-(const TimeTicks& other) const {
  return TimeDelta::FromMicroseconds(ticks_ - other.ticks_);
}

TimeTicks TimeTicks::Now() {
#if 1
  static LARGE_INTEGER ticks_per_sec;
  if (!ticks_per_sec.QuadPart)
    ::QueryPerformanceFrequency(&ticks_per_sec);
  LARGE_INTEGER counter;
  ::QueryPerformanceCounter(&counter);
  return TimeTicks(counter.QuadPart * Time::kMicrosecondsPerSecond /
                   ticks_per_sec.QuadPart);
#else
  // For Win8 or later.
  // The number of 100-naooseconds until since the start of January 1, 1601.
  FILETIME ft_now;
  ::GetSystemTimePreciseAsFileTime(&ft_now);
  LARGE_INTEGER now;
  now.HighPart = ft_now.dwHighDateTime;
  now.LowPart = ft_now.dwLowDateTime;
  return TimeTicks(now.QuadPart / (Time::kNanosecondsPerMicrosecond / 100));
#endif
}

}  // namespace base

#endif //!defined(INCLUDE_base_time_time_h)

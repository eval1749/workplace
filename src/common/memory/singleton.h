// Copyright (c) 2014 Project Vogue. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#if !defined(INCLUDE_common_memory_singleton_h)
#define INCLUDE_common_memory_singleton_h

class SingletonBase {
  protected: SingletonBase() = default;
  public: virtual ~SingletonBase() = default;

  DISALLOW_COPY_AND_ASSIGN(SingletonBase);
};

std::vector<SingletonBase*>* all_singletons;

template<class T>
class Singleton : public SingletonBase {
  protected: Singleton() = default;
  protected: ~Singleton() = default;

  public: static T* instance() {
    static T* instance;
    if (!instance) {
      instance = new T();
      all_singletons->push_back(instance);
    }
    return instance;
  }

  DISALLOW_COPY_AND_ASSIGN(Singleton);
};

#define DECLARE_SINGLETON_CLASS(name) \
  friend class Singleton<name>

#endif //!defined(INCLUDE_common_memory_singleton_h)

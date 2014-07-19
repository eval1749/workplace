// C4530 L1: C++ exception handler used, but unwind semantics are not enabled.
// Specify /EHsc
#pragma warning(disable: 4530)

#define UNICODE
#define WIN32_LEAN_AND_MEAN
#define WINVER 0x0700
#define _WIN32_WINNT 0x0700
#include <windows.h>
#undef max
#undef min
#include <dcomp.h>
#include <d3d11.h>
#include <d2d1.h>
#include <d2d1helper.h>
#include <dwmapi.h>
#include <dwrite.h>
#include <dxgi1_3.h>

#include <algorithm>
#include <iostream>
#include <limits>
#include <list>
#include <memory>
#include <string>
#include <sstream>
#include <unordered_set>

#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dcomp.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "dwrite.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "user32.lib")

#ifndef HINST_THISCOMPONENT
EXTERN_C IMAGE_DOS_HEADER __ImageBase;
#define HINST_THISCOMPONENT ((HINSTANCE)&__ImageBase)
#endif

#define DVLOG(m) std::cerr
#define NOTREACHED() __debugbreak()

#define COM_VERIFY(expr) { \
  auto const macro_hr = (expr); \
  if (FAILED(macro_hr)) { \
    DVLOG(ERROR) << "hr=" << std::hex << macro_hr << " " <<  #expr; \
    NOTREACHED(); \
  } \
}

#define WIN32_VERIFY(expr) { \
  if (!(expr)) { \
    auto const last_error = ::GetLastError(); \
    DVLOG(ERROR) << "Faild: " << #expr << " err=" << last_error; \
  } \
}

#define DCHECK(expr) (Check(__FILE__, __LINE__, #expr, (expr)))

std::ostream& Check(const char* file_name, int line_number,
                    const char* expr_string, bool expr_value) {
  if (expr_value) {
    static std::stringstream null_stream;
    return null_stream;
  }
  std::cerr << "Assetion failed: " << expr_string << std::endl <<
      "File: " << file_name << std::endl <<
      "Line: " << line_number;
  NOTREACHED();
  return std::cerr;
}

namespace base {
typedef wchar_t char16;
typedef std::wstring string16;
typedef std::char_traits<wchar_t> string16_char_traits;
}  // base

//////////////////////////////////////////////////////////////////////
//
// LARGE_INTEGER
//
LARGE_INTEGER operator+(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart - large2.QuadPart;
  return result;
}

LARGE_INTEGER operator-(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart - large2.QuadPart;
  return result;
}

LARGE_INTEGER operator*(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart * large2.QuadPart;
  return result;
}

LARGE_INTEGER operator*(const LARGE_INTEGER& large1, int int2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart * int2;
  return result;
}

LARGE_INTEGER operator/(const LARGE_INTEGER& large1,
                        const LARGE_INTEGER& large2) {
  LARGE_INTEGER result;
  result.QuadPart = large1.QuadPart / large2.QuadPart;
  return result;
}

//////////////////////////////////////////////////////////////////////
//
// ComPtr
//
template<class T> class ComPtr {
  private: T* ptr_;
  public: explicit ComPtr(T* ptr = nullptr) : ptr_(ptr) {}
  public: explicit ComPtr(T& ptr) : ptr_(&ptr) {}
  public: ComPtr(const ComPtr& other) : ptr_(other.ptr_) {
    if (ptr_)
      ptr_->AddRef();
  }
  public: ComPtr(ComPtr&& other) : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }
  public: ~ComPtr() {
    reset();
  }
  public: operator T*() const { return ptr_; }
  public: explicit operator bool() const { return ptr_; }
  public: T* operator->() const { return ptr_; }
  public: T** operator&() {
    DCHECK(!ptr_) << "Leak COM interface";
    return &ptr_;
  }
  public: bool operator!() const { return !ptr_; }

  public: bool operator==(const ComPtr& other) const {
    return ptr_ == other.ptr_;
  }

  public: bool operator==(T* other) const {
    return ptr_ == other;
  }

  public: bool operator!=(const ComPtr& other) const {
    return ptr_ != other.ptr_;
  }

  public: bool operator!=(T* other) const {
    return ptr_ != other;
  }

  public: ComPtr& operator=(const ComPtr& other) {
    ptr_ = other.ptr_;
    if (ptr_)
      ptr_->AddRef();
  }

  public: ComPtr& operator=(ComPtr&& other) {
    ptr_ = other.ptr_;
    other.ptr_ = nullptr;
    return *this;
  }

  public: T* get() const { return ptr_; }

  public: void** location() {
    DCHECK(!ptr_) << "Leak COM interface";
    return reinterpret_cast<void**>(&ptr_);
  }

  public: IUnknown** locationUnknown() {
    DCHECK(!ptr_) << "Leak COM interface";
    return reinterpret_cast<IUnknown**>(&ptr_);
  }

  public: T* release() {
    DCHECK(ptr_) << "Give ownership for uninitialized object";
    auto const ret = ptr_;
    ptr_ = nullptr;
    return ret;
  }

  public: void reset(T* ptr) {
    if (ptr_)
      ptr_->Release();
    ptr_ = ptr;
    if (ptr_)
      ptr_->AddRef();
  }

  public: void reset() {
    if (ptr_)
      ptr_->Release();
    ptr_ = nullptr;
  }

  public: void MustBeNoOtherUse() {
    auto const ref_count = ptr_->AddRef();
    ptr_->Release();
    DCHECK(ref_count == 2);
  }

  public: HRESULT QueryFrom(IUnknown* other) {
    return other->QueryInterface(__uuidof(T), location());
  }
};

class ComInitializer {
  public: ComInitializer() {
    COM_VERIFY(::CoInitialize(nullptr));
  }
  public: ~ComInitializer() {
    ::CoUninitialize();
  }
};

class SingletonBase {
  protected: SingletonBase() = default;
  protected: ~SingletonBase() = default;
};

std::vector<SingletonBase*>* all_singletons;

template<class T>
class Singleton : public SingletonBase {
  public: static T* instance() {
    static T* instance;
    if (!instance) {
      instance = new T();
      all_singletons->push_back(instance);
    }
    return instance;
  }
};

#define DECLARE_SINGLETON_CLASS(name) \
  friend class Singleton<name>

namespace gfx {
//////////////////////////////////////////////////////////////////////
//
// Brush
//
class Brush final {
  private: ComPtr<ID2D1SolidColorBrush> brush_;

  public: Brush(ID2D1RenderTarget* render_target, D2D1::ColorF::Enum color,
                float alpha = 1.0f);
  public: Brush(ID2D1RenderTarget* render_target, D2D1::ColorF color);
  public: ~Brush() = default;

  public: operator ID2D1SolidColorBrush*() const { return brush_; }
};

Brush::Brush(ID2D1RenderTarget* render_target, D2D1::ColorF::Enum name,
             float alpha) {
  COM_VERIFY(render_target->CreateSolidColorBrush(D2D1::ColorF(name, alpha),
                                                  &brush_));
}

Brush::Brush(ID2D1RenderTarget* render_target, D2D1::ColorF color) {
  COM_VERIFY(render_target->CreateSolidColorBrush(color, &brush_));
}

//////////////////////////////////////////////////////////////////////
//
// PointF
//
class PointF final {
  private: D2D1_POINT_2F point_;

  public: PointF(const PointF& other);
  public: PointF(const D2D1_POINT_2F& point);
  public: PointF(float x, float y);
  public: PointF();

  public: operator D2D1_POINT_2F() const { return point_; }

  public: PointF& operator=(float new_value);
  public: PointF& operator+=(const PointF& other);
  public: PointF& operator+=(float new_value);
  public: PointF& operator-=(const PointF& other);
  public: PointF& operator-=(float new_value);

  public: bool operator==(const PointF& other) const;
  public: bool operator!=(const PointF& other) const;

  public: float x() { return point_.x; }
  public: void set_x(float new_x) { point_.x = new_x; }
  public: float y() { return point_.y; }
  public: void set_y(float new_y) { point_.y = new_y; }
};

PointF::PointF(const PointF& other) : point_(other.point_) {
}

PointF::PointF(const D2D1_POINT_2F& point) : point_(point) {
}

PointF::PointF(float x, float y) {
  point_.x = x;
  point_.y = y;
}

PointF::PointF() : PointF(0.0f, 0.0f) {
}

PointF& PointF::operator=(float new_value) {
  point_.x = point_.y = new_value;
  return *this;
}

PointF& PointF::operator+=(const PointF& other) {
  point_.x += other.point_.x;
  point_.y += other.point_.y;
  return *this;
}

PointF& PointF::operator+=(float new_value) {
  point_.x += new_value;
  point_.y += new_value;
  return *this;
}

PointF& PointF::operator-=(const PointF& other) {
  point_.x += other.point_.x;
  point_.y += other.point_.y;
  return *this;
}

PointF& PointF::operator-=(float new_value) {
  point_.x -= new_value;
  point_.y -= new_value;
  return *this;
}

bool PointF::operator==(const PointF& other) const {
  return point_.x == other.point_.x && point_.y == other.point_.y;
}

bool PointF::operator!=(const PointF& other) const {
  return !operator==(other);
}

}  // namespace gfx

namespace cc {

//////////////////////////////////////////////////////////////////////
//
// Factory
//
// This class is a singleton class provieds:
//  - D2D1Factory
//  - D3D11 Device
//  - Composition Device
//
class Factory final : public Singleton<Factory> {
  DECLARE_SINGLETON_CLASS(Factory);

  private: ComPtr<ID2D1Factory1> d2d_factory_;
  private: ComPtr<ID3D11Device> d3d_device_;
  private: ComPtr<IDWriteFactory> dwrite_factory_;

  public: Factory();
  public: ~Factory();

  public: ID2D1Factory1* d2d_factory() const { return d2d_factory_; }
  public: ID3D11Device* d3d_device() const { return d3d_device_; }
  public: IDWriteFactory* dwrite() const { return dwrite_factory_; }

  public: ComPtr<IDCompositionDesktopDevice> CreateCompositionDevice();
};

Factory::Factory() {
  // Create DWrite factory.
  COM_VERIFY(::DWriteCreateFactory(
      DWRITE_FACTORY_TYPE_SHARED,
      __uuidof(IDWriteFactory),
      dwrite_factory_.locationUnknown()));

  // Create Direct 2D factory.
  COM_VERIFY(::D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED,
                                 &d2d_factory_));

  // Create Direct 3D device.
  D3D_FEATURE_LEVEL feature_levels[] = {
      D3D_FEATURE_LEVEL_11_1,
      D3D_FEATURE_LEVEL_11_0,
  };

  auto const d3d11_flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT |
                           D3D11_CREATE_DEVICE_SINGLETHREADED |
                           D3D11_CREATE_DEVICE_DEBUG;

  COM_VERIFY(::D3D11CreateDevice(
      nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
      d3d11_flags, nullptr, 0, D3D11_SDK_VERSION,
      &d3d_device_, feature_levels, nullptr));
}

Factory::~Factory(){
  d2d_factory_.MustBeNoOtherUse();
  d3d_device_.MustBeNoOtherUse();
}

ComPtr<IDCompositionDesktopDevice> Factory::CreateCompositionDevice() {
  ComPtr<IDXGIDevice> dxgi_device;
  COM_VERIFY(dxgi_device.QueryFrom(d3d_device_));

  // Create Direct Composition device.
  ComPtr<IDCompositionDesktopDevice> composition_device;
  COM_VERIFY(::DCompositionCreateDevice2(dxgi_device,
      __uuidof(IDCompositionDesktopDevice), composition_device.location()));
  return composition_device;
}

//////////////////////////////////////////////////////////////////////
//
// cc::Layer
//
class Layer {
  private: D2D1_RECT_F bounds_;
  private: std::vector<Layer*> child_layers_;
  private: ComPtr<ID2D1DeviceContext> d2d_device_context_;
  private: bool is_active_;
  private: ComPtr<IDXGISwapChain2> swap_chain_;
  private: HANDLE swap_chain_waitable_;
  private: ComPtr<IDCompositionVisual2> visual_;

  public: Layer(IDCompositionDesktopDevice* composition_device);
  public: ~Layer();

  public: operator IDCompositionVisual2*() const { return visual_; }

  public: const D2D1_RECT_F& bounds() const { return bounds_; }
  public: ID2D1DeviceContext* d2d_device_context() const {
    return d2d_device_context_;
  }
  protected: bool is_active() const { return is_active_; }
  protected: bool is_swap_chain_ready() const;
  public: IDXGISwapChain2* swap_chain() const { return swap_chain_; }
  public: IDCompositionVisual2* visual() const { return visual_; }

  public: void AppendChild(Layer* new_child);
  private: ComPtr<ID2D1DeviceContext> CreateD2DDeviceContext(
      IDXGISwapChain2* swap_chain, int width, int height);
  private: ComPtr<IDXGISwapChain2> CreateSwapChain(int width, int height);
  public: virtual void DidActive();
  public: virtual void DidInactive();
  public: virtual bool DoAnimate(uint32_t tick_count);
  public: void Present();
  public: void Resize(int width, int height);
  public: void SetLeftTop(float left, float top);
};

Layer::Layer(IDCompositionDesktopDevice* composition_device)
    : is_active_(false), swap_chain_waitable_(nullptr) {
  COM_VERIFY(composition_device->CreateVisual(&visual_));
  COM_VERIFY(visual_->SetBitmapInterpolationMode(
      DCOMPOSITION_BITMAP_INTERPOLATION_MODE_LINEAR));
  COM_VERIFY(visual_->SetBorderMode(DCOMPOSITION_BORDER_MODE_SOFT));
}

Layer::~Layer() {
  visual_->SetContent(nullptr);
  d2d_device_context_.MustBeNoOtherUse();
}

bool Layer::is_swap_chain_ready() const {
  auto const wait = ::WaitForSingleObject(swap_chain_waitable_, 0);
  switch (wait){
    case WAIT_OBJECT_0:
      return true;
    case WAIT_TIMEOUT:
      return false;
    default:
      NOTREACHED();
  }
  return false;
}

void Layer::AppendChild(Layer* new_child) {
  child_layers_.push_back(new_child);
  COM_VERIFY(visual_->AddVisual(new_child->visual_, true, nullptr));
}

ComPtr<ID2D1DeviceContext> Layer::CreateD2DDeviceContext(
      IDXGISwapChain2* swap_chain, int width, int height) {
  ComPtr<IDXGIDevice1> dxgi_device;
  COM_VERIFY(dxgi_device.QueryFrom(Factory::instance()->d3d_device()));

  ComPtr<ID2D1Device> d2d_device;
  COM_VERIFY(Factory::instance()->d2d_factory()->CreateDevice(
      dxgi_device, &d2d_device));

  ComPtr<ID2D1DeviceContext> d2d_device_context;
  COM_VERIFY(d2d_device->CreateDeviceContext(
      D2D1_DEVICE_CONTEXT_OPTIONS_NONE, &d2d_device_context));

  ComPtr<IDXGISurface> dxgi_back_buffer;
  swap_chain->GetBuffer(0, IID_PPV_ARGS(&dxgi_back_buffer));

  float dpi_x, dpi_y;
  Factory::instance()->d2d_factory()->GetDesktopDpi(&dpi_x, &dpi_y);
  D2D1_BITMAP_PROPERTIES1 bitmapProperties = D2D1::BitmapProperties1(
      D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW,
      D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM,
                        D2D1_ALPHA_MODE_PREMULTIPLIED),
      dpi_x, dpi_y);

  ComPtr<ID2D1Bitmap1> d2d_back_buffer;
  COM_VERIFY(d2d_device_context->CreateBitmapFromDxgiSurface(
      dxgi_back_buffer, &bitmapProperties, &d2d_back_buffer));
  d2d_device_context->SetTarget(d2d_back_buffer);
  d2d_device_context->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_CLEARTYPE);
  d2d_device_context.MustBeNoOtherUse();
  return d2d_device_context;
}

ComPtr<IDXGISwapChain2> Layer::CreateSwapChain(int width, int height) {
  ComPtr<IDXGIDevice> dxgi_device;
  COM_VERIFY(dxgi_device.QueryFrom(Factory::instance()->d3d_device()));

  ComPtr<IDXGIAdapter> dxgi_adapter;
  dxgi_device->GetAdapter(&dxgi_adapter);

  ComPtr<IDXGIFactory2> dxgi_factory;
  dxgi_adapter->GetParent(IID_PPV_ARGS(&dxgi_factory));

  DXGI_SWAP_CHAIN_DESC1 swap_chain_desc = {0};
  swap_chain_desc.AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED;
  swap_chain_desc.Width = width;
  swap_chain_desc.Height = height;
  swap_chain_desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
  swap_chain_desc.SampleDesc.Count = 1; // don't use multi-sampling
  swap_chain_desc.SampleDesc.Quality = 0;
  swap_chain_desc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
  swap_chain_desc.BufferCount = 2;  // use double buffering to enable flip
  swap_chain_desc.Scaling = DXGI_SCALING_STRETCH;
  swap_chain_desc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL;
  swap_chain_desc.Flags = DXGI_SWAP_CHAIN_FLAG_FRAME_LATENCY_WAITABLE_OBJECT;

  ComPtr<IDXGISwapChain1> swap_chain1;
  COM_VERIFY(dxgi_factory->CreateSwapChainForComposition(
      Factory::instance()->d3d_device(), &swap_chain_desc, nullptr,
      &swap_chain1));
  ComPtr<IDXGISwapChain2> swap_chain2;
  COM_VERIFY(swap_chain2.QueryFrom(swap_chain1));
  COM_VERIFY(swap_chain2->SetMaximumFrameLatency(2));
  return swap_chain2;
}

void Layer::DidActive() {
  if (is_active_)
    return;
  is_active_ = true;
  for (auto const child : child_layers_) {
    child->DidActive();
  }
}

void Layer::DidInactive() {
  if (!is_active_)
    return;
  is_active_ = false;
  for (auto const child : child_layers_) {
    child->DidInactive();
  }
}

bool Layer::DoAnimate(uint32_t tick_count) {
  auto animated = false;
  for (auto const child : child_layers_) {
    animated |= child->DoAnimate(tick_count);
  }
  return animated;
}

void Layer::Present() {
  DXGI_PRESENT_PARAMETERS present_params = {0};
  COM_VERIFY(swap_chain_->Present1(1, 0, &present_params));
}

void Layer::Resize(int width, int height) {
  bounds_.left = 0.0f;
  bounds_.top = 0.0f;
  bounds_.right = static_cast<float>(width);
  bounds_.bottom = static_cast<float>(height);

  swap_chain_.reset(CreateSwapChain(width, height));
  swap_chain_.MustBeNoOtherUse();
  swap_chain_waitable_ = swap_chain_->GetFrameLatencyWaitableObject();
  COM_VERIFY(visual_->SetContent(swap_chain_));
  d2d_device_context_ = CreateD2DDeviceContext(swap_chain_, width, height);
  d2d_device_context_.MustBeNoOtherUse();
}

void Layer::SetLeftTop(float left, float top) {
  COM_VERIFY(visual_->SetOffsetX(left));
  COM_VERIFY(visual_->SetOffsetY(top));
}

}  // namespace cc

//////////////////////////////////////////////////////////////////////
//
// Window
//
class Window {
  protected: class Creator {
    public: Creator(Window* window);
    public: ~Creator();
  };
  friend class Creator;

  private: RECT bounds_;
  private: HWND hwnd_;
  private: bool is_active_;

  protected: Window();
  protected: ~Window();

  public: operator HWND() const { return hwnd_; }

  public: const RECT& bounds() const { return bounds_; }
  public: bool is_active() const { return is_active_; }

  protected: virtual void DidActive();
  protected: virtual void DidCreate();
  protected: virtual void DidInactive();
  protected: virtual void DidResize();

  protected: static LPWSTR GetWindowClass();
  private: static Window* GetWindowFromHwnd(HWND hwnd);
  protected: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                       LPARAM lParam);
  private: void Init();
  public: void Run();
  protected: virtual void WillDestroy();
  private: static LRESULT CALLBACK WindowProc(HWND hwnd, UINT message,
                                              WPARAM wParam, LPARAM lParam);
};

//////////////////////////////////////////////////////////////////////
//
// Window::Creator
//
static Window* global_creating_window;

Window::Creator::Creator(Window* window) {
  global_creating_window = window;
}

Window::Creator::~Creator(){
  global_creating_window = nullptr;
}

//////////////////////////////////////////////////////////////////////
//
// Window
//
Window::Window() : hwnd_(nullptr), is_active_(false) {
}

Window::~Window() {
}

void Window::DidActive() {
  is_active_ = true;
}

void Window::DidCreate() {
}

void Window::DidInactive() {
  is_active_ = false;
}

void Window::DidResize() {
}

LPWSTR Window::GetWindowClass() {
  static LPWSTR class_name;
  if (class_name)
    return class_name;
  WNDCLASSEX wcex = { sizeof(WNDCLASSEX) };
  wcex.style = CS_HREDRAW | CS_VREDRAW;
  wcex.lpfnWndProc = Window::WindowProc;
  wcex.cbClsExtra = 0;
  wcex.cbWndExtra = sizeof(LONG_PTR);
  wcex.hInstance = HINST_THISCOMPONENT;
  wcex.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW+1);;
  wcex.lpszMenuName = nullptr;
  wcex.hCursor = ::LoadCursor(nullptr, IDC_ARROW);
  wcex.lpszClassName = L"Window";
  class_name = MAKEINTATOM(::RegisterClassEx(&wcex));
  return class_name;
}

Window* Window::GetWindowFromHwnd(HWND hwnd) {
  auto const window = reinterpret_cast<Window*>(
      ::GetWindowLongPtr(hwnd, GWLP_USERDATA));
  if (window)
    return window;
  ::SetWindowLongPtr(hwnd, GWLP_USERDATA,
                     reinterpret_cast<LONG_PTR>(global_creating_window));
  global_creating_window->hwnd_ = hwnd;
  return global_creating_window;
}

void Window::Init() {
}

LRESULT Window::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_ACTIVATE:
      is_active_ = wParam != WA_INACTIVE;
      if (is_active_)
        DidActive();
      else
        DidInactive();
      return 0;
    case WM_CREATE:
      ::GetClientRect(*this, &bounds_);
      DidCreate();
      return 1;
    case WM_DESTROY:
      WillDestroy();
      break;
    case WM_NCDESTROY:
      ::PostQuitMessage(0);
      return TRUE;
    case WM_WINDOWPOSCHANGED: {
      auto const wp = reinterpret_cast<WINDOWPOS*>(lParam);
      if (wp->flags & SWP_NOSIZE)
        return 0;
      if (!::IsIconic(*this)) {
        ::GetClientRect(*this, &bounds_);
        DidResize();
      }
      return 0;
    }
  }
  return ::DefWindowProc(hwnd_, message, wParam, lParam);
}

void Window::Run() {
  Init();
  MSG msg;
  while (::GetMessage(&msg, nullptr, 0, 0)) {
    ::TranslateMessage(&msg);
    ::DispatchMessage(&msg);
  }
}

LRESULT Window::WindowProc(HWND hwnd, UINT message, WPARAM wParam,
                          LPARAM lParam) {
  auto const window = GetWindowFromHwnd(hwnd);
  return window->OnMessage(message, wParam, lParam);
}

void Window::WillDestroy() {
}

//////////////////////////////////////////////////////////////////////
//
// Animator
//
class Animator {
  protected: Animator() = default;
  protected: virtual ~Animator() = default;

  public: virtual void DoAnimate() = 0;
};

//////////////////////////////////////////////////////////////////////
//
// Scheduler
//
class Scheduler final : public Singleton<Scheduler> {
  private: std::unordered_set<Animator*> animators_;

  public: Scheduler();
  public: ~Scheduler();

  public: void Add(Animator* animator);
  private: void DidFireTimer();

  private: static void CALLBACK TimerProc(HWND hwnd, UINT message,
                                          UINT_PTR timer_id, DWORD time);
};

Scheduler::Scheduler() {
  ::SetTimer(nullptr, reinterpret_cast<UINT_PTR>(this), 1,
             Scheduler::TimerProc);
}

Scheduler::~Scheduler() {
}

void Scheduler::Add(Animator* animator) {
  animators_.insert(animator);
}

void Scheduler::DidFireTimer() {
  for (auto const animator : animators_) {
    animator->DoAnimate();
  }
}

void CALLBACK Scheduler::TimerProc(HWND, UINT, UINT_PTR, DWORD) {
  Scheduler::instance()->DidFireTimer();
}

//////////////////////////////////////////////////////////////////////
//
// Sampling
//
class Sampling {
  private: float maximum_;
  private: float minimum_;
  private: size_t max_samples_;
  private: std::list<float> samples_;

  public: Sampling(size_t max_samples);
  public: ~Sampling() = default;

  public: float last() const { return samples_.back(); }
  public: float maximum() const { return maximum_; }
  public: float minimum() const { return minimum_; }

  public: void AddSample(float);
  public: void Paint(ID2D1RenderTarget* canvas, const gfx::Brush& brush,
                     const D2D1_RECT_F& bounds) const;
};

Sampling::Sampling(size_t max_samples) :
    maximum_(0.0f),
    minimum_(0.0f),
    max_samples_(max_samples), samples_(max_samples) {
}

void Sampling::AddSample(float sample) {
  auto const discard_sample = samples_.front();
  samples_.pop_front();
  samples_.push_back(sample);
  if (discard_sample != maximum_ && discard_sample != minimum_)
    return;
  maximum_ = std::numeric_limits<float>::min();
  minimum_ = std::numeric_limits<float>::max();
  for (auto const sample : samples_) {
    maximum_ = std::max(maximum_, sample);
    minimum_ = std::min(minimum_, sample);
  }
}

void Sampling::Paint(ID2D1RenderTarget* canvas, const gfx::Brush& brush,
                     const D2D1_RECT_F& bounds) const {
  auto const maximum = maximum_ * 1.1f;
  auto const minimum = minimum_ * 0.9f;
  if (maximum == minimum)
    return;
  auto const scale = (bounds.bottom - bounds.top) / (maximum - minimum_);
  auto  last_point = gfx::PointF(
      bounds.left, bounds.bottom - (samples_.front() - minimum_) * scale);
  auto x_step = (bounds.right - bounds.left) / samples_.size();
  auto sum = 0.0f;
  for (auto const sample : samples_) {
    sum += sample;
    auto const curr_point = gfx::PointF(
        last_point.x() + x_step, bounds.bottom - (sample - minimum_) * scale);
    canvas->DrawLine(last_point, curr_point, brush, 1.0f);
    last_point = curr_point;
  }
  auto const avg = sum / samples_.size();
  auto const avg_y = bounds.bottom - (avg - minimum_) * scale;
  canvas->DrawLine(gfx::PointF(bounds.left, avg_y),
                   gfx::PointF(bounds.right, avg_y),
                   brush, 2.0f);
  COM_VERIFY(canvas->Flush());
}

//////////////////////////////////////////////////////////////////////
//
// Card
//
class Card : public cc::Layer {
  private: mutable D2D1_RECT_F content_bounds_;
  private: float shadow_height_;
  private: float shadow_width_;

  protected: Card(IDCompositionDesktopDevice* composition_device);
  protected: virtual ~Card() = default;

  public: D2D1_RECT_F& content_bounds() const;

  protected: void PaintBackground(ID2D1RenderTarget* canvas) const;

  // cc::Layer
  private: virtual void DidInactive() override;
};

Card::Card(IDCompositionDesktopDevice* composition_device)
    : Layer(composition_device), shadow_height_(10), shadow_width_(10) {
}

D2D1_RECT_F& Card::content_bounds() const {
  content_bounds_ = bounds();
  content_bounds_.right -= shadow_width_;
  content_bounds_.bottom -= shadow_height_;
  return content_bounds_;
}

void Card::PaintBackground(ID2D1RenderTarget* canvas) const {
  canvas->Clear(D2D1::ColorF(D2D1::ColorF::White, 0.0f));
  auto shadow_bounds = content_bounds();
  shadow_bounds.left += shadow_width_;
  shadow_bounds.top += shadow_height_;
  shadow_bounds.right += shadow_width_;
  shadow_bounds.bottom += shadow_width_;
  canvas->FillRoundedRectangle(D2D1::RoundedRect(shadow_bounds, 2.0f, 2.0f),
                               gfx::Brush(canvas, D2D1::ColorF::Black, 0.1f));
  canvas->FillRoundedRectangle(D2D1::RoundedRect(content_bounds(), 2.0f, 2.0f),
                               gfx::Brush(canvas, D2D1::ColorF::White));
}

// cc::Layer
void Card::DidInactive() {
  Layer::DidInactive();

  auto const bounds = content_bounds();

  // Paint "Paused" in center of layer.
  auto const font_size = 40;
  ComPtr<IDWriteTextFormat> text_format;
  COM_VERIFY(cc::Factory::instance()->dwrite()->CreateTextFormat(
    L"Verdana", nullptr, DWRITE_FONT_WEIGHT_REGULAR, DWRITE_FONT_STYLE_NORMAL,
    DWRITE_FONT_STRETCH_NORMAL, font_size, L"en-us", &text_format));

  base::string16 text(L"Paused");
  ComPtr<IDWriteTextLayout> text_layout;
  COM_VERIFY(cc::Factory::instance()->dwrite()->CreateTextLayout(
      text.data(), static_cast<UINT>(text.length()), text_format,
      bounds.right - bounds.left, bounds.bottom - bounds.top,
      &text_layout));

  DWRITE_TEXT_METRICS text_metrics;
  COM_VERIFY(text_layout->GetMetrics(&text_metrics));

  auto const text_origin = gfx::PointF(
    bounds.left + ((bounds.right - bounds.left) - text_metrics.width) / 2,
    bounds.top + ((bounds.bottom - bounds.top) - text_metrics.height) / 2);

  auto const canvas = d2d_device_context();
  canvas->BeginDraw();

  canvas->FillRectangle(bounds,
    gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::Black, 0.6f)));

  gfx::Brush text_brush(canvas, D2D1::ColorF(D2D1::ColorF::White, 0.9f));
  canvas->DrawTextLayout(text_origin, text_layout, text_brush);

  COM_VERIFY(canvas->EndDraw());
  Present();
}

//////////////////////////////////////////////////////////////////////
//
// CartoonCard
//
class CartoonCard : public Card {
  private: class Ball {
    private: float angle_;
    private: gfx::PointF center_;
    private: gfx::PointF motion_;
    private: float size_;
    private: uint32_t tick_count_;

    public: Ball(float angle, float size, const gfx::PointF& center,
                 const gfx::PointF& motion,
                 uint32_t tick_count);
    public: ~Ball() = default;

    public: void DoAnimate(ID2D1RenderTarget* canvas,
                           const D2D1_RECT_F& bounds,
                           uint32_t tick_count);
  };

  private: std::vector<std::unique_ptr<Ball>> balls_;
  private: uint32_t last_tick_count_;
  private: DXGI_FRAME_STATISTICS last_stats_;
  private: ComPtr<IDWriteTextFormat> text_format_;

  public: CartoonCard(IDCompositionDesktopDevice* composition_device);
  public: virtual ~CartoonCard();

  // cc::Layer
  private: virtual bool DoAnimate(uint32_t tick_count) override;
};

//////////////////////////////////////////////////////////////////////
//
// CartoonCard
//
CartoonCard::CartoonCard(IDCompositionDesktopDevice* composition_device)
    : Card(composition_device), balls_(4),
      last_tick_count_(::GetTickCount()) {
  last_stats_ = {0};

  balls_[0].reset(new Ball(0.0f, 10.0f,
                           gfx::PointF(10, 10), gfx::PointF(1.3, 1.2),
                           last_tick_count_));
  balls_[1].reset(new Ball(30.0f, 10.0f,
                           gfx::PointF(90, 10), gfx::PointF(-2.0, 1.5),
                           last_tick_count_));
  balls_[2].reset(new Ball(90.0f, 15.0f,
                           gfx::PointF(30, 90), gfx::PointF(1.0, -1.0),
                           last_tick_count_));
  balls_[3].reset(new Ball(180.0f, 20.0f,
                           gfx::PointF(90, 90), gfx::PointF(-1.0, -1.0),
                           last_tick_count_));

  auto const font_size = 13;
  COM_VERIFY(cc::Factory::instance()->dwrite()->CreateTextFormat(
    L"Consolas", nullptr, DWRITE_FONT_WEIGHT_REGULAR, DWRITE_FONT_STYLE_NORMAL,
    DWRITE_FONT_STRETCH_NORMAL, font_size, L"en-us", &text_format_));
}

CartoonCard::~CartoonCard() {
}

bool CartoonCard::DoAnimate(uint32_t tick_count) {
  if (!is_active())
    return false;
  if (!is_swap_chain_ready())
    return false;
  auto const canvas = d2d_device_context();
  canvas->BeginDraw();
  PaintBackground(canvas);
  for (auto& ball : balls_) {
    ball->DoAnimate(canvas, content_bounds(), tick_count);
  }

  DXGI_FRAME_STATISTICS stats = {0};
  // Ignore errors. |GetFrameStatistics()| returns
  // DXGI_ERROR_FRAME_STATISTICS_DISJOINT.
  swap_chain()->GetFrameStatistics(&stats);

  std::basic_ostringstream<base::char16> stream;
  stream << L"TickCount=" << tick_count - last_tick_count_ << std::endl;
  stream << L"PresentCount=" <<
      stats.PresentCount - last_stats_.PresentCount << std::endl;
  stream << L"PresentRefreshCount=" <<
      stats.PresentRefreshCount - last_stats_.PresentRefreshCount << std::endl;
  stream << L"SyncQPCTime=" <<
      stats.SyncQPCTime.QuadPart -
          last_stats_.SyncQPCTime.QuadPart << std::endl;
  stream << L"SyncGPUTime=" <<
      stats.SyncGPUTime.QuadPart -
          last_stats_.SyncGPUTime.QuadPart << std::endl;

  const auto text = stream.str();
  ComPtr<IDWriteTextLayout> text_layout;
  COM_VERIFY(cc::Factory::instance()->dwrite()->CreateTextLayout(
      text.data(), static_cast<UINT>(text.length()), text_format_,
      content_bounds().right - content_bounds().left,
      content_bounds().bottom - content_bounds().top,
      &text_layout));

  gfx::Brush text_brush(canvas, D2D1::ColorF(D2D1::ColorF::Black, 0.5f));
  canvas->DrawTextLayout(gfx::PointF(5.0f, 5.0f), text_layout, text_brush,
                         D2D1_DRAW_TEXT_OPTIONS_CLIP);
  COM_VERIFY(canvas->EndDraw());
  Present();

  last_stats_ = stats;
  last_tick_count_ = tick_count;
  return true;
}

//////////////////////////////////////////////////////////////////////
//
// CartoonCard::Ball
//
CartoonCard::Ball::Ball(float angle, float size,
                         const gfx::PointF& center,
                         const gfx::PointF& motion, uint32_t tick_count)
    : angle_(angle), center_(center), motion_(motion), size_(size),
      tick_count_(tick_count) {
  motion_ = 1.0f;
}

void CartoonCard::Ball::DoAnimate(ID2D1RenderTarget* canvas,
                                   const D2D1_RECT_F& bounds,
                                   uint32_t tick_count) {
  if (tick_count_ == tick_count)
    return;
  auto const tick_delta = std::max((tick_count - tick_count_) / 16, 1u);
  tick_count_ = tick_count;
  for (auto count = 0u; count < tick_delta; ++count) {
    center_ += motion_;
    if (center_.x() - size_ < bounds.left ||
        center_.x() + size_ > bounds.right) {
      motion_.set_x(-motion_.x());
      center_ += gfx::PointF(motion_.x(), 0.0f);
    }
    if (center_.y() - size_ < bounds.top ||
        center_.y() + size_ > bounds.bottom) {
      motion_.set_y(-motion_.y());
      center_ += gfx::PointF(0.0f, motion_.y());
    }
  }

  angle_ = ::fmod(angle_ + tick_delta, 360.0f);

  canvas->SetTransform(D2D1::Matrix3x2F::Rotation(angle_, center_));

  D2D1_ELLIPSE ellipse;
  ellipse.point = center_;
  ellipse.radiusX = size_;
  ellipse.radiusY = size_;
  canvas->FillEllipse(ellipse,
      gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::Blue, 0.5)));

  auto const rect_size = size_ * 0.5f;
  canvas->FillRectangle(
      D2D1::RectF(center_.x() - rect_size, center_.y() - rect_size,
                  center_.x() + rect_size, center_.y() + rect_size),
      gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::Green, 0.7f)));

  canvas->SetTransform(D2D1::IdentityMatrix());
  canvas->Flush();
}

//////////////////////////////////////////////////////////////////////
//
// StatusLayer
//
class StatusLayer : public cc::Layer {
  private: ComPtr<IDCompositionDesktopDevice> composition_device_;
  private: DCOMPOSITION_FRAME_STATISTICS last_stats_;
  private: uint32_t last_tick_count_;
  private: Sampling sample_duration_;
  private: Sampling sample_last_frame_;
  private: Sampling sample_next_frame_;
  private: Sampling sample_tick_;
  private: ComPtr<IDWriteTextFormat> text_format_;
  private: ComPtr<IDWriteTextLayout> text_layout_;

  public: StatusLayer(IDCompositionDesktopDevice* composition_device);
  public: virtual ~StatusLayer();

  private: virtual bool DoAnimate(uint32_t tick_count) override;
};

StatusLayer::StatusLayer(IDCompositionDesktopDevice* composition_device)
    : Layer(composition_device), composition_device_(composition_device),
      last_tick_count_(::GetTickCount()), sample_duration_(100),
      sample_last_frame_(100), sample_next_frame_(100), sample_tick_(100) {
  COM_VERIFY(composition_device_->GetFrameStatistics(&last_stats_));

  auto const font_size = 13;
  COM_VERIFY(cc::Factory::instance()->dwrite()->CreateTextFormat(
    L"Consolas", nullptr, DWRITE_FONT_WEIGHT_REGULAR, DWRITE_FONT_STYLE_NORMAL,
    DWRITE_FONT_STRETCH_NORMAL, font_size, L"en-us", &text_format_));
}

StatusLayer::~StatusLayer() {
}

bool StatusLayer::DoAnimate(uint32_t tick_count) {
  if (!is_swap_chain_ready())
    return false;
  DCOMPOSITION_FRAME_STATISTICS stats;
  COM_VERIFY(composition_device_->GetFrameStatistics(&stats));

  auto const canvas = d2d_device_context();
  canvas->BeginDraw();
  canvas->Clear(D2D1::ColorF(0, 0, 0, 0.5));

  // Update samples
  sample_tick_.AddSample(tick_count - last_tick_count_);
  sample_duration_.AddSample(
    ((stats.currentTime - last_stats_.currentTime) * 1000 /
     stats.timeFrequency).QuadPart);
  sample_last_frame_.AddSample(
    ((stats.lastFrameTime - last_stats_.lastFrameTime) * 1000 /
     stats.timeFrequency).QuadPart);
  sample_next_frame_.AddSample(
    ((stats.nextEstimatedFrameTime - last_stats_.nextEstimatedFrameTime) *
     1000 / stats.timeFrequency).QuadPart);
  last_stats_ = stats;
  last_tick_count_ = tick_count;

  // Paint graph
  sample_duration_.Paint(canvas,
      gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::Red, 0.5f)),
      D2D1::RectF(bounds().left, bounds().bottom - 20,
                  bounds().right, bounds().bottom));
  sample_last_frame_.Paint(canvas,
      gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::Yellow, 0.5f)),
      D2D1::RectF(bounds().left, bounds().bottom - 40,
                  bounds().right, bounds().bottom - 20));
  sample_last_frame_.Paint(canvas,
      gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::Blue, 0.5f)),
      D2D1::RectF(bounds().left, bounds().bottom - 60,
                  bounds().right, bounds().bottom - 40));
  sample_tick_.Paint(canvas,
      gfx::Brush(canvas, D2D1::ColorF(D2D1::ColorF::White, 0.5f)),
      D2D1::RectF(bounds().left, bounds().bottom - 80,
                  bounds().right, bounds().bottom - 60));

  // Samples values
  std::basic_ostringstream<base::char16> stream;
  stream << L"Tick=" << sample_tick_.minimum() << L" " <<
      sample_tick_.maximum() << L" " << sample_tick_.last() << std::endl;
  stream << L"LastFrameTime=" << sample_last_frame_.minimum() <<
      L" " << sample_last_frame_.maximum() <<
      L" " << sample_last_frame_.last() << std::endl;
  stream << L"CurrentTime=" << sample_duration_.minimum() <<
      L" " << sample_duration_.minimum() <<
      L" " << sample_duration_.last() << std::endl;
  stream << L"NextFrame=" << sample_next_frame_.minimum() <<
      L" " << sample_next_frame_.maximum() <<
      L" " << sample_next_frame_.last() << std::endl;
  stream << L"rate=" << stats.currentCompositionRate.Numerator <<
      L"/" << stats.currentCompositionRate.Denominator << std::endl;
  stream << L"hz=" << stats.timeFrequency.QuadPart << std::endl;

  const auto text = stream.str();

  text_layout_.reset();
  COM_VERIFY(cc::Factory::instance()->dwrite()->CreateTextLayout(
      text.data(), static_cast<UINT>(text.length()), text_format_,
      bounds().right - bounds().left, bounds().bottom - bounds().top,
      &text_layout_));

  gfx::Brush text_brush(canvas, D2D1::ColorF::LightGray);
  canvas->DrawTextLayout(gfx::PointF(5.0f, 5.0f), text_layout_, text_brush,
                         D2D1_DRAW_TEXT_OPTIONS_CLIP);

  COM_VERIFY(canvas->EndDraw());
  Present();
  return true;
}

//////////////////////////////////////////////////////////////////////
//
// MyApp
//
class MyApp : public Window, private Animator {
  private: ComPtr<IDCompositionDesktopDevice> composition_device_;
  private: ComPtr<IDCompositionTarget> composition_target_;
  private: uint32_t last_animate_tick_;
  private: std::unique_ptr<CartoonCard> cartoon_layer_;
  private: std::unique_ptr<cc::Layer> root_layer_;
  private: std::unique_ptr<StatusLayer> status_layer_;

  public: MyApp();
  public: virtual ~MyApp();

  public: void Run();

  // Animator
  private: virtual void DoAnimate() override;

  // Window
  private: virtual void DidActive() override;
  private: virtual void DidCreate() override;
  private: virtual void DidInactive() override;
  private: virtual void DidResize() override;
  private: virtual LRESULT OnMessage(UINT message, WPARAM wParam,
                                     LPARAM lParam) override;
  private: virtual void WillDestroy() override;
};

MyApp::MyApp() : last_animate_tick_(0) {
}

MyApp::~MyApp() {
}

void MyApp::Run() {
  float dpi_x, dpi_y;
  cc::Factory::instance()->d2d_factory()->GetDesktopDpi(&dpi_x, &dpi_y);

  Window::Creator creator(this);
  auto const hwnd = ::CreateWindow(
    GetWindowClass(),
    L"Window Title",
    WS_OVERLAPPEDWINDOW,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    static_cast<UINT>(ceil(640.f * dpi_x / 96.f)),
    static_cast<UINT>(ceil(480.f * dpi_y / 96.f)),
    nullptr,
    nullptr,
    HINST_THISCOMPONENT,
    nullptr);
  if (!hwnd)
    return;
  ::ShowWindow(hwnd, SW_SHOWNORMAL);
  Scheduler::instance()->Add(this);
  Window::Run();
}

// Animator
void MyApp::DoAnimate() {
  auto const tick_count = ::GetTickCount();
  auto const delta = tick_count - last_animate_tick_;
  auto const kBackgroundAnimate = 100;
  if (!is_active() && delta < kBackgroundAnimate)
    return;
  last_animate_tick_ = tick_count;
  root_layer_->DoAnimate(tick_count);
}

// Window
void MyApp::DidActive() {
  Window::DidActive();
  root_layer_->DidActive();
}

void MyApp::DidCreate() {
  Window::DidCreate();
  composition_device_ = cc::Factory::instance()->CreateCompositionDevice();
  root_layer_.reset(new cc::Layer(composition_device_));
  cartoon_layer_.reset(new CartoonCard(composition_device_));
  status_layer_.reset(new StatusLayer(composition_device_));
  root_layer_->AppendChild(status_layer_.get());
  root_layer_->AppendChild(cartoon_layer_.get());

  COM_VERIFY(composition_device_->CreateTargetForHwnd(
      *this, true, &composition_target_));
  COM_VERIFY(composition_target_->SetRoot(root_layer_->visual()));

  DidResize();
}

void MyApp::DidInactive() {
  root_layer_->DidInactive();
}

void MyApp::DidResize() {
  auto const width = bounds().right - bounds().left;
  auto const height = bounds().bottom - bounds().top;

  auto const tab_height = 32.0f;
  auto const splitter_height = 5.0f;
  auto const pane_height = (height - splitter_height - tab_height) / 2;

  root_layer_->Resize(width, height);

  // Resize status visual
  {
    auto const status_width = 240.0f;;
    auto const status_height = 200.0f;
    status_layer_->Resize(status_width, status_height);
    status_layer_->SetLeftTop(20, height / 2);

    // Setup transform for status visual
    ComPtr<IDCompositionRotateTransform> rotate_transform;
    COM_VERIFY(composition_device_->CreateRotateTransform(&rotate_transform));
    COM_VERIFY(rotate_transform->SetCenterX(status_width / 2));
    COM_VERIFY(rotate_transform->SetCenterY(status_height / 2));
    COM_VERIFY(rotate_transform->SetAngle(-5));
    COM_VERIFY(status_layer_->visual()->SetTransform(rotate_transform));
  }

  // Paint root visual
  {
    auto const canvas = root_layer_->d2d_device_context();
    canvas->BeginDraw();
    canvas->Clear(D2D1::ColorF(0, 0, 0, 0));

    D2D1_RECT_F pane_bounds[2];
    pane_bounds[0].left = 0;
    pane_bounds[0].right = width;
    pane_bounds[0].top = tab_height;
    pane_bounds[0].bottom = pane_height;

    pane_bounds[1].left = 0;
    pane_bounds[1].right = width;
    pane_bounds[1].top = pane_bounds[0].bottom + splitter_height;
    pane_bounds[1].bottom = height;

  // Resize cartoon visual
    cartoon_layer_->Resize(pane_bounds[0].right - pane_bounds[0].left,
                           pane_bounds[0].bottom - pane_bounds[0].top);
    cartoon_layer_->SetLeftTop(pane_bounds[0].left, pane_bounds[0].top);

#if 0
    gfx::Brush white_brush(canvas,
                            D2D1::ColorF(D2D1::ColorF::White, 0.3f));

    gfx::Brush green_brush(canvas,
                           D2D1::ColorF(D2D1::ColorF::Green, 0.5f));

    for (auto i = 0; i < 2; ++i) {
      canvas->FillRectangle(pane_bounds[i], white_brush);
      auto const pane_height = pane_bounds[i].bottom - pane_bounds[i].top;
      auto const pane_width = pane_bounds[i].right - pane_bounds[i].left;
      D2D1_ELLIPSE ellipse;
      ellipse.point = gfx::PointF(pane_bounds[i].left + pane_width / 2,
                                    pane_bounds[i].top + pane_height / 2);
      ellipse.radiusX = pane_width / 3;
      ellipse.radiusY = pane_height / 3;
      canvas->FillEllipse(ellipse, green_brush);
    }
#endif

    COM_VERIFY(canvas->EndDraw());
    root_layer_->Present();
  }

  // Update composition
  composition_device_->Commit();
}

LRESULT MyApp::OnMessage(UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_ACTIVATE: {
        MARGINS margins;
        margins.cxLeftWidth = 0;
        margins.cxRightWidth = 0;
        margins.cyBottomHeight = 0;
        margins.cyTopHeight = -1;
        COM_VERIFY(::DwmExtendFrameIntoClientArea(*this, &margins));
        break;
    }
    case WM_PAINT: {
      // Fill window client area with alpha=0.
      PAINTSTRUCT ps;
      auto const hdc = ::BeginPaint(*this, &ps);
      ::FillRect(hdc, &ps.rcPaint,
                 static_cast<HBRUSH>(::GetStockObject(BLACK_BRUSH)));
      ::EndPaint(*this, &ps);
      return 1;
    }
  }
  return Window::OnMessage(message, wParam, lParam);
}

void MyApp::WillDestroy() {
#if 0
  composition_target_->SetRoot(nullptr);
  root_layer_.reset();
  status_layer_.reset();
  composition_target_.MustBeNoOtherUse();
  composition_target_.reset();
  composition_device_.reset();
#endif
  Window::WillDestroy();
}

//////////////////////////////////////////////////////////////////////
//
// WinMain
//
int WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
  std::vector<SingletonBase*> singletons;
  all_singletons = &singletons;
  ::AllocConsole();
  ComInitializer com_initializer;
  MyApp my_app;
  my_app.Run();
  return 0;
}